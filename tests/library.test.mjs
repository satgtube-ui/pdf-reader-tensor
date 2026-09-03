import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const project = fileURLToPath(new URL("../", import.meta.url));
const generator = path.join(project, "scripts", "generate-index.mjs");

async function fixture(t, files) {
  const tempRoot = path.resolve(os.tmpdir());
  const directory = await fs.mkdtemp(path.join(tempRoot, "html-library-test-"));
  t.after(async () => {
    assert.equal(path.dirname(directory), tempRoot);
    assert.ok(path.basename(directory).startsWith("html-library-test-"));
    await fs.rm(directory, { recursive: true, force: true });
  });
  for (const [name, html] of Object.entries(files)) {
    const target = path.join(directory, "public", "notes", name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, html);
  }
  execFileSync(process.execPath, [generator], { cwd: directory });
  return fs.readFile(path.join(directory, "public", "index.html"), "utf8");
}

test("groups subfolders, sorts chapter numbers, and keeps ungrouped notes", async (t) => {
  const html = await fixture(t, {
    "embryology/10-ten.html": "<title>Chapter 10</title>",
    "embryology/2-two.html": "<title>Chapter 2</title>",
    "embryology/00-front-matter.html": "<title>Front matter</title>",
    "embryology/appendix/extra.html": "<title>Appendix</title>",
    "cerebrum.html": "<title>Cerebrum</title>",
  });
  assert.match(html, /<h2[^>]*>EMBRYOLOGY<\/h2>/);
  assert.match(html, /<h2[^>]*>Other notes<\/h2>/);
  assert.equal((html.match(/class="note-group"/g) || []).length, 2);
  assert.match(html, /class="group-count">4 notes/);
  const urls = [...html.matchAll(/<a href="(\/notes\/[^\"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(urls, [
    "/notes/embryology/00-front-matter.html",
    "/notes/embryology/2-two.html",
    "/notes/embryology/10-ten.html",
    "/notes/embryology/appendix/extra.html",
    "/notes/cerebrum.html",
  ]);
});

test("escapes uploaded titles and group names and encodes file URLs", async (t) => {
  const html = await fixture(t, {
    'subject & study/01-A & B.html': '<title>A &amp; B &lt;img src=x onerror=alert(1)&gt;</title>',
  });
  assert.match(html, /SUBJECT &amp; STUDY/);
  assert.match(html, /A &amp; B &lt;img src=x onerror=alert\(1\)&gt;/);
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes('/notes/subject%20%26%20study/01-A%20%26%20B.html'));
});

function wireSearch(html, definitions) {
  const events = {};
  const search = { value: "", addEventListener: (name, fn) => { events[name] = fn; } };
  const count = { textContent: "" };
  const empty = { style: {} };
  const navigation = { style: {} };
  const groups = definitions.map((terms) => {
    const notes = terms.map((term) => ({ style: {}, getAttribute: () => term }));
    return { style: {}, notes, count: { textContent: "" }, querySelectorAll() { return notes; }, querySelector() { return this.count; } };
  });
  const notes = groups.flatMap((group) => group.notes);
  const document = {
    getElementById: (id) => ({ search, count, "no-results": empty, "group-nav": navigation })[id],
    querySelectorAll: (selector) => selector === ".note" ? notes : groups,
  };
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, { document }, { timeout: 1000 });
  return { groups, count, empty, navigation, setQuery(value) { search.value = value; events.input(); } };
}

test("search hides empty groups, matches subjects, and resets correctly", async (t) => {
  const html = await fixture(t, { "embryology/01-one.html": "<title>One</title>" });
  const ui = wireSearch(html, [["embryology chapter 1", "embryology chapter 2"], ["other notes cerebrum"]]);
  ui.setQuery(" EMBRYOLOGY ");
  assert.equal(ui.count.textContent, "2 notes");
  assert.equal(ui.groups[0].style.display, "");
  assert.equal(ui.groups[1].style.display, "none");
  assert.equal(ui.groups[0].count.textContent, "2 notes");
  ui.setQuery("cerebrum");
  assert.equal(ui.count.textContent, "1 note");
  assert.equal(ui.groups[0].style.display, "none");
  assert.equal(ui.groups[1].style.display, "");
  ui.setQuery("no such note");
  assert.equal(ui.count.textContent, "0 notes");
  assert.equal(ui.empty.style.display, "block");
  ui.setQuery("");
  assert.equal(ui.count.textContent, "3 notes");
  assert.equal(ui.empty.style.display, "none");
  assert.equal(ui.navigation.style.display, "");
  assert.ok(ui.groups.every((group) => group.style.display === ""));
});

test("empty library is readable without search or JavaScript errors", async (t) => {
  const html = await fixture(t, {});
  assert.match(html, /No HTML notes yet/);
  assert.match(html, /0 notes/);
  assert.doesNotThrow(() => wireSearch(html, []));
});

test("published library keeps ordered subject groups and the legacy redirect", async () => {
  const html = await fs.readFile(path.join(project, "public", "index.html"), "utf8");
  const urls = [...html.matchAll(/<a href="(\/notes\/[^\"]+)"/g)].map((match) => match[1]);
  const embryology = urls.filter((url) => url.startsWith("/notes/embryology/"));
  assert.equal(embryology.length, 23);
  assert.deepEqual(embryology.map((url) => Number(path.basename(url).slice(0, 2))), Array.from({ length: 23 }, (_, index) => index));
  const biochemistry = urls.filter((url) => url.startsWith("/notes/biochemistry/"));
  assert.equal(biochemistry.length, 33);
  assert.deepEqual(biochemistry.map((url) => Number(path.basename(url).slice(0, 2))), Array.from({ length: 33 }, (_, index) => index + 1));
  assert.match(html, /<h2[^>]*>BIOCHEMISTRY<\/h2>/);
  assert.match(html, /<h2[^>]*>EMBRYOLOGY<\/h2>/);
  assert.match(html, /<h2[^>]*>Other notes<\/h2>/);
  async function noteUrls(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const found = [];
    for (const entry of entries) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) found.push(...await noteUrls(file));
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
        found.push("/" + path.relative(path.join(project, "public"), file).split(path.sep).map(encodeURIComponent).join("/"));
      }
    }
    return found;
  }
  assert.deepEqual([...urls].sort(), (await noteUrls(path.join(project, "public", "notes"))).sort());
  assert.equal(urls.filter((url) => url.includes("pharyngeal-arches")).length, 1);
  for (const url of urls) await fs.access(path.join(project, "public", decodeURIComponent(url)));
  const config = JSON.parse(await fs.readFile(path.join(project, "vercel.json"), "utf8"));
  assert.ok(config.redirects.some((rule) => rule.source === "/notes/pharyngeal-arches.html" && rule.destination === "/notes/embryology/09-the-pharyngeal-arches.html" && rule.permanent));
});
