import { promises as fs } from "node:fs";
import path from "node:path";

const notesDirectory = path.resolve("public", "notes");
const outputFile = path.resolve("public", "index.html");

async function findHtmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findHtmlFiles(entryPath)));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) files.push(entryPath);
  }

  return files;
}

function decodeTitle(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"', nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] !== "#") return named[entity.toLowerCase()] ?? match;
    const radix = entity[1].toLowerCase() === "x" ? 16 : 10;
    const digits = radix === 16 ? entity.slice(2) : entity.slice(1);
    return String.fromCodePoint(Number.parseInt(digits, radix));
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function titleFromHtml(html, fallback) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return fallback;
  const title = decodeTitle(match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
  return title || fallback;
}

function readableName(filePath) {
  return path
    .basename(filePath, path.extname(filePath))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function publicUrl(filePath) {
  const relativePath = path.relative(path.resolve("public"), filePath);
  return `/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
}

await fs.mkdir(notesDirectory, { recursive: true });

const noteFiles = await findHtmlFiles(notesDirectory);
const notes = await Promise.all(
  noteFiles.map(async (filePath) => {
    const fallback = readableName(filePath);
    const html = await fs.readFile(filePath, "utf8");
    return {
      href: publicUrl(filePath),
      title: titleFromHtml(html, fallback),
      filename: path.basename(filePath),
    };
  }),
);

notes.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

const cards = notes.length
  ? notes
      .map(
        (note, index) => `
        <li class="note" data-search="${escapeHtml(`${note.title} ${note.filename}`.toLowerCase())}">
          <a href="${escapeHtml(note.href)}">
            <span class="number">${String(index + 1).padStart(2, "0")}</span>
            <span class="note-copy">
              <strong>${escapeHtml(note.title)}</strong>
              <small>${escapeHtml(note.filename)}</small>
            </span>
            <span class="open" aria-hidden="true">Open&nbsp;›</span>
          </a>
        </li>`,
      )
      .join("")
  : `<li class="empty">No HTML notes yet. Add a file to <code>public/notes</code> and deploy again.</li>`;

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f6f2e8">
  <meta name="description" content="A lightweight library of study flowcharts and HTML notes.">
  <title>Study Flowcharts</title>
  <style>
    :root { color-scheme: light; --paper: #f6f2e8; --card: #fffdf8; --ink: #20231f; --muted: #6c7169; --line: #d9d5ca; --green: #305c4d; }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body { margin: 0; min-height: 100vh; background: var(--paper); color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
    main { width: 100%; max-width: 780px; margin: 0 auto; padding: 44px 20px 64px; }
    header { margin-bottom: 28px; }
    .eyebrow { margin: 0 0 8px; color: var(--green); font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: 46px; font-size: clamp(34px, 7vw, 58px); font-weight: 500; line-height: 1; letter-spacing: -.035em; }
    .intro { max-width: 560px; margin: 14px 0 0; color: var(--muted); font-size: 16px; line-height: 1.55; }
    .tools { display: flex; align-items: center; gap: 12px; margin: 26px 0 16px; }
    .search { flex: 1; min-width: 0; height: 48px; padding: 0 15px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); color: var(--ink); font: inherit; font-size: 16px; -webkit-appearance: none; }
    .search:focus { outline: 3px solid rgba(48, 92, 77, .16); border-color: var(--green); }
    .count { flex: 0 0 auto; margin-left: 12px; color: var(--muted); font-size: 13px; white-space: nowrap; }
    ul { margin: 0; padding: 0; border-top: 1px solid var(--line); list-style: none; }
    .note { border-bottom: 1px solid var(--line); }
    .note a { display: flex; min-height: 86px; align-items: center; gap: 16px; padding: 15px 4px; color: inherit; text-decoration: none; }
    .note a:active { background: rgba(48, 92, 77, .07); }
    .number { width: 32px; color: var(--green); font-family: Georgia, serif; font-size: 14px; }
    .note-copy { flex: 1; min-width: 0; margin: 0 16px; }
    strong { display: block; font-family: Georgia, "Times New Roman", serif; font-size: 20px; font-weight: 600; line-height: 1.25; }
    small { display: block; overflow: hidden; margin-top: 6px; color: var(--muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .open { color: var(--green); font-size: 14px; font-weight: 700; }
    .empty { padding: 28px 4px; color: var(--muted); line-height: 1.5; }
    .no-results { display: none; padding: 28px 4px; color: var(--muted); border-bottom: 1px solid var(--line); }
    footer { margin-top: 28px; color: var(--muted); font-size: 12px; }
    @media (hover: hover) { .note a:hover { background: rgba(255, 253, 248, .75); } .note a:hover .open { text-decoration: underline; } }
    @media (max-width: 480px) { main { padding: 30px 16px 48px; } .tools { align-items: stretch; flex-direction: column; } .count { margin: 10px 0 0; padding-left: 2px; } .note a { min-height: 80px; gap: 10px; } .note-copy { margin: 0 10px; } .number { width: 25px; } strong { font-size: 18px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">Personal study library</p>
      <h1>Study Flowcharts</h1>
      <p class="intro">Open any note below. This page stays fast and simple for comfortable reading on an older iPad.</p>
    </header>
    <div class="tools">
      <input id="search" class="search" type="search" placeholder="Search notes" aria-label="Search notes" autocomplete="off">
      <span id="count" class="count">${notes.length} ${notes.length === 1 ? "note" : "notes"}</span>
    </div>
    <ul id="notes">${cards}</ul>
    <p id="no-results" class="no-results">No notes match that search.</p>
    <footer>HTML only · no app installation required</footer>
  </main>
  <script>
    (function () {
      var search = document.getElementById("search");
      var count = document.getElementById("count");
      var empty = document.getElementById("no-results");
      var notes = document.querySelectorAll(".note");
      if (!search || !notes.length) return;
      search.addEventListener("input", function () {
        var query = search.value.toLowerCase().replace(/^\\s+|\\s+$/g, "");
        var visible = 0;
        for (var i = 0; i < notes.length; i += 1) {
          var match = notes[i].getAttribute("data-search").indexOf(query) !== -1;
          notes[i].style.display = match ? "" : "none";
          if (match) visible += 1;
        }
        count.textContent = visible + (visible === 1 ? " note" : " notes");
        empty.style.display = visible ? "none" : "block";
      });
    }());
  </script>
</body>
</html>
`;

await fs.writeFile(outputFile, page, "utf8");
console.log(`Generated ${path.relative(process.cwd(), outputFile)} with ${notes.length} note${notes.length === 1 ? "" : "s"}.`);
