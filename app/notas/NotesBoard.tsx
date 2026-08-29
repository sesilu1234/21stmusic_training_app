"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { addNote, editNote, removeNote } from "./actions";
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

/** Se considera retocada si pasó algo más de un segundo entre crearla y guardarla. */
const wasEdited = (note: Note) =>
  new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000;

export default function NotesBoard({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /** Nota que se está editando y cómo va quedando. Null = no hay ninguna. */
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

  const shortDate = (value: string) =>
    new Date(value).toLocaleDateString("es-ES");

  const replace = (updated: Note) =>
    setNotes((current) =>
      current.map((note) => (note.id === updated.id ? updated : note)),
    );

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

  const saveEdit = () => {
    if (!editing || isPending) return;

    const text = editing.text.trim();
    if (!text) {
      setError("La nota no puede quedarse vacía. Bórrala si ya no la quieres.");
      return;
    }

    const previous = notes.find((note) => note.id === editing.id);
    if (!previous) return;

    // Sin cambios no se molesta al servidor.
    if (text === previous.text) {
      setEditing(null);
      return;
    }

    setError(null);
    setEditing(null);
    replace({ ...previous, text });

    startTransition(async () => {
      const result = await editNote(previous.id, text);
      if (result.ok) {
        replace(result.note);
      } else {
        // Se deshace y se vuelve a abrir el editor con lo que había escrito,
        // para no perder el cambio por un fallo de red.
        replace(previous);
        setEditing({ id: previous.id, text });
        setError(result.error);
      }
    });
  };

  const discard = (note: Note) => {
    setError(null);
    if (editing?.id === note.id) setEditing(null);
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
        {notes.map((note) => {
          const isEditing = editing?.id === note.id;

          return (
            <div
              key={note.id}
              className="group rounded-2xl border border-white/5 bg-black/35 p-4"
            >
              <div className="mb-1 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-amber-400">
                {shortDate(note.createdAt)}
                {wasEdited(note) && (
                  <span
                    className="text-white/25"
                    title={`Editada el ${shortDate(note.updatedAt)}`}
                  >
                    · editada
                  </span>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editing.text}
                    autoFocus
                    onChange={(event) =>
                      setEditing({
                        id: note.id,
                        text: event.target.value.slice(0, MAX_NOTE_LENGTH),
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        saveEdit();
                      }
                      if (event.key === "Escape") setEditing(null);
                    }}
                    rows={Math.min(10, editing.text.split("\n").length + 1)}
                    className="w-full resize-none rounded-xl border border-amber-300/30 bg-black/40 p-3 text-sm text-white focus:border-amber-300/60 focus:outline-none"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/40 transition hover:text-white"
                    >
                      <X size={13} />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-amber-300 disabled:opacity-40"
                    >
                      <Check size={13} />
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 whitespace-pre-wrap break-words text-sm text-white/75">
                    {note.text}
                  </p>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setEditing({ id: note.id, text: note.text });
                      }}
                      className="text-white/20 transition hover:text-amber-300"
                      aria-label="Editar nota"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => discard(note)}
                      className="text-white/20 transition hover:text-rose-400"
                      aria-label="Borrar nota"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {notes.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/30">
            Todavía no has escrito ninguna nota.
          </p>
        )}
      </div>
    </div>
  );
}
