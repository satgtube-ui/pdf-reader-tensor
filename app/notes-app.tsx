"use client";

import { FormEvent, useMemo, useState } from "react";

export type NoteFile = {
  name: string;
  fileName: string;
  folder: string;
  url: string;
};

export default function NotesApp({ initialAuthenticated, notes }: { initialAuthenticated: boolean; notes: NoteFile[] }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedUrl, setSelectedUrl] = useState(notes[0]?.url ?? "");
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredNotes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return notes;
    return notes.filter((note) => `${note.name} ${note.folder} ${note.fileName}`.toLowerCase().includes(needle));
  }, [notes, query]);

  const selected = notes.find((note) => note.url === selectedUrl) ?? notes[0];

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setSubmitting(false);
    if (!response.ok) {
      setError("That username or password is not correct.");
      return;
    }

    window.location.reload();
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    setAuthenticated(false);
    setPassword("");
  }

  if (!authenticated) {
    return (
      <main className="login-page">
        <section className="login-story">
          <div className="brand"><span className="brand-mark">M</span> Margin</div>
          <div className="story-copy">
            <p className="eyebrow">Your personal study shelf</p>
            <h1>Less space.<br />More focus.</h1>
            <p>Your PDFs, arranged in one quiet place and ready to read wherever your iPad goes.</p>
          </div>
          <div className="story-foot">Private notes / Zero distractions</div>
        </section>
        <section className="login-form-wrap">
          <form className="login-card" onSubmit={signIn}>
            <p className="eyebrow">Welcome back</p>
            <h2>Open your notes</h2>
            <p>Sign in to continue to your study library.</p>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <button className="primary-button" disabled={submitting}>{submitting ? "Opening..." : "Enter library"}</button>
            <p className="error" aria-live="polite">{error}</p>
          </form>
        </section>
      </main>
    );
  }

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
          <span className="count">Study mode</span>
          <button className="text-button" onClick={signOut}>Sign out</button>
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
