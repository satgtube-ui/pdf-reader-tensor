"use client";

import { useMemo, useState } from "react";

export type NoteFile = {
  name: string;
  fileName: string;
  folder: string;
  url: string;
};

export default function NotesApp({ notes }: { notes: NoteFile[] }) {
  const [query, setQuery] = useState("");
  const [selectedUrl, setSelectedUrl] = useState(notes[0]?.url ?? "");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredNotes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return notes;
    return notes.filter((note) => `${note.name} ${note.folder} ${note.fileName}`.toLowerCase().includes(needle));
  }, [notes, query]);

  const selected = notes.find((note) => note.url === selectedUrl) ?? notes[0];

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="Notes library">
        <div className="sidebar-head">
          <div className="topline">
            <div className="brand"><span className="brand-mark">M</span> Margin</div>
            <span className="count">{notes.length} {notes.length === 1 ? "note" : "notes"}</span>
          </div>
          <label className="search">
            <span aria-hidden="true">Q</span>
            <input aria-label="Search notes" placeholder="Search your notes" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>
        <div className="notes-list">
          {filteredNotes.map((note) => (
            <button key={note.url} className={`note-row ${selected?.url === note.url ? "active" : ""}`} onClick={() => { setSelectedUrl(note.url); setMenuOpen(false); }}>
              <span className="pdf-icon">PDF</span>
              <span>
                <strong>{note.name}</strong>
                <small>{note.folder}</small>
              </span>
            </button>
          ))}
          {notes.length > 0 && filteredNotes.length === 0 && <p className="no-results">No notes match &quot;{query}&quot;.</p>}
        </div>
        <div className="sidebar-foot">
          <span className="count">Open study library</span>
        </div>
      </aside>

      <section className="reader">
        <header className="reader-bar">
          <button className="mobile-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>Library</button>
          <div className="reader-title">
            <strong>{selected?.name ?? "Your notes library"}</strong>
            <span>{selected?.folder ?? "Ready when you are"}</span>
          </div>
          {selected && <a className="open-button" href={selected.url} target="_blank" rel="noreferrer">Open PDF</a>}
        </header>

        {selected ? (
          <iframe className="pdf-frame" key={selected.url} src={`${selected.url}#view=FitH`} title={`Reading ${selected.name}`} />
        ) : (
          <div className="empty-reader">
            <div className="empty-card">
              <span className="empty-number">1</span>
              <h2>Add your first note</h2>
              <p>Place any PDF inside <code>public/notes</code>, commit it to GitHub, and redeploy. It will appear here automatically.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
