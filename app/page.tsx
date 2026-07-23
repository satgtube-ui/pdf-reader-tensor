import fs from "node:fs";
import path from "node:path";
import NotesApp, { type NoteFile } from "./notes-app";

function labelFromFileName(fileName: string) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function findPdfNotes(directory: string, baseDirectory = directory): NoteFile[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) return findPdfNotes(absolutePath, baseDirectory);
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".pdf")) return [];

    const relativePath = path.relative(baseDirectory, absolutePath);
    const pathParts = relativePath.split(path.sep);
    const folder = pathParts.length > 1 ? labelFromFileName(pathParts.at(-2) ?? "") : "General";
    const url = `/notes/${pathParts.map(encodeURIComponent).join("/")}`;

    return [{
      name: labelFromFileName(entry.name),
      fileName: entry.name,
      folder,
      url,
    }];
  });
}

export default function Home() {
  const notes = findPdfNotes(path.join(process.cwd(), "public", "notes"))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  return <NotesApp notes={notes} />;
}
