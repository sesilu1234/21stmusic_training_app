"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Note {
  id: number;
  date: string;
  text: string;
}

export default function NotesBoard({ storageKey }: { storageKey: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setNotes(saved ? JSON.parse(saved) : []);
    } catch {
      setNotes([]);
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, storageKey, loaded]);

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    setNotes([
      { id: Date.now(), date: new Date().toLocaleDateString("es-ES"), text },
      ...notes,
    ]);
    setDraft("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-2xl border border-white/10 bg-black/45 p-4">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escribe una nota de estudio..."
          className="h-12 flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        <button
          type="button"
          onClick={addNote}
          className="rounded-xl bg-amber-400 px-4 font-bold text-black transition hover:bg-amber-300"
          aria-label="Añadir nota"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-black/35 p-4"
          >
            <div className="min-w-0">
              <div className="mb-1 text-[8px] font-black uppercase tracking-[0.2em] text-amber-400">
                {note.date}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-white/75">{note.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotes(notes.filter((item) => item.id !== note.id))}
              className="flex-shrink-0 text-white/20 transition hover:text-rose-400"
              aria-label="Borrar nota"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {loaded && notes.length === 0 && (
          <p className="rounded-2xl border border-white/5 bg-black/30 p-5 text-sm text-white/40">
            Todavía no tienes notas guardadas.
          </p>
        )}
      </div>
    </div>
  );
}
