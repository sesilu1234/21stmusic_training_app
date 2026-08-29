"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addNote, removeNote } from "./actions";
import { MAX_NOTE_LENGTH, type Note } from "@/lib/notes";

/**
 * Las notas ya no viven en el navegador sino en la cuenta, así que la lista
 * llega ya cargada desde el servidor y cada cambio pasa por una acción.
 *
 * La pantalla se actualiza en el momento y se corrige si el servidor dice que
 * no: escribir un apunte y quedarte mirando un botón medio segundo es lo que
 * hace que una app se sienta lenta. Si algo falla, la nota vuelve a su sitio y
 * se explica por qué.
 */
export default function NotesBoard({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dateOf = (note: Note) =>
    new Date(note.createdAt).toLocaleDateString("es-ES");

  const submit = () => {
    const text = draft.trim();
    if (!text || isPending) return;

    setError(null);
    setDraft("");

    startTransition(async () => {
      const result = await addNote(text);
      if (result.ok) {
        setNotes((current) => [result.note, ...current]);
      } else {
        // Se devuelve lo escrito: perder el texto de un apunte por un fallo de
        // red sería lo peor que puede hacer esta pantalla.
        setDraft(text);
        setError(result.error);
      }
    });
  };

  const discard = (note: Note) => {
    setError(null);
    setNotes((current) => current.filter((item) => item.id !== note.id));

    startTransition(async () => {
      const result = await removeNote(note.id);
      if (!result.ok) {
        setNotes((current) =>
          [...current, note].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        );
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
        <div className="flex gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_NOTE_LENGTH))}
            onKeyDown={(event) => {
              // Enter guarda; Mayús+Enter hace un salto de línea.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Escribe una nota de estudio..."
            className="h-12 flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || isPending}
            className="rounded-xl bg-amber-400 px-4 font-bold text-black transition hover:bg-amber-300 disabled:opacity-40"
            aria-label="Añadir nota"
          >
            <Plus size={20} />
          </button>
        </div>

        {draft.length > MAX_NOTE_LENGTH - 200 && (
          <p className="mt-2 text-right text-[10px] text-white/30">
            {draft.length} / {MAX_NOTE_LENGTH}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group flex items-start justify-between gap-3 rounded-2xl border border-white/5 bg-black/35 p-4"
          >
            <div className="min-w-0">
              <div className="mb-1 text-[8px] font-black uppercase tracking-[0.2em] text-amber-400">
                {dateOf(note)}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-white/75">
                {note.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => discard(note)}
              className="flex-shrink-0 text-white/20 transition hover:text-rose-400"
              aria-label="Borrar nota"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/30">
            Todavía no has escrito ninguna nota.
          </p>
        )}
      </div>
    </div>
  );
}
