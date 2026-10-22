"use client";

import { useState, useTransition } from "react";
import { Delete, Plus, Trash2 } from "lucide-react";
import PianoKeyboard from "@/app/components/PianoKeyboard";
import { fullNoteName } from "@/lib/vocalizaciones";
import {
  MAX_MELODY_NAME,
  MAX_MELODY_NOTES,
  MELODY_LOWEST,
  soundingCount,
  type Melody,
} from "@/lib/melodies";
import { removeMelody, saveMelody } from "./actions";
import { Field, Stepper } from "@/app/play/vocalControls";

/** Los mismos topes que el ajuste de velocidad de la pantalla y que la base de datos. */
const MIN_BPM = 40;
const MAX_BPM = 200;

/**
 * Crear o retocar una melodía: se toca en el piano, nota a nota, y se guarda.
 *
 * Todas las notas duran lo mismo, igual que en los ejercicios. Es a propósito:
 * con duraciones habría que escribir ritmo, y esto es para cantar una frase,
 * no para hacer una partitura. Lo que no se ve aquí (velocidad, tesitura,
 * acompañamiento) se elige después, al cantarla, como en cualquier ejercicio.
 */
export default function MelodyEditor({
  melody,
  bpm,
  sound,
  onSaved,
  onDeleted,
  onCancel,
}: {
  /** La que se está retocando, o nada si es nueva. */
  melody?: Melody;
  /** Velocidad con la que se guarda una nueva. */
  bpm: number;
  sound: (semitone: number) => void;
  onSaved: (melody: Melody) => void;
  onDeleted: (id: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(melody?.name ?? "");
  /** Una por pulso; `null` es un silencio. */
  const [notes, setNotes] = useState<(number | null)[]>(melody?.notes ?? []);
  /** La velocidad con la que se propone al cantarla. Luego se puede cambiar abajo. */
  const [tempo, setTempo] = useState(melody?.bpm ?? bpm);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const full = notes.length >= MAX_MELODY_NOTES;
  const canSave = !pending && name.trim().length > 0 && soundingCount(notes) >= 2;

  const add = (semitone: number) => {
    sound(semitone);
    if (full) return;
    setNotes((current) => [...current, semitone]);
    setError(null);
  };

  /** Un pulso sin nota. Los del final no se guardan: ahí ya va la espera entre vueltas. */
  const addRest = () => {
    if (full) return;
    setNotes((current) => [...current, null]);
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveMelody({
        id: melody?.id,
        name,
        notes,
        bpm: tempo,
      });
      if (result.ok) onSaved(result.melody);
      else setError(result.error);
    });

  const remove = () => {
    if (!melody || !window.confirm(`¿Borrar «${melody.name}»?`)) return;
    startTransition(async () => {
      const result = await removeMelody(melody.id);
      if (result.ok) onDeleted(melody.id);
      else setError(result.error);
    });
  };

  const last = notes[notes.length - 1];

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-sm md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
              {melody ? "Editar melodía" : "Nueva melodía"}
            </p>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_MELODY_NAME}
              placeholder="Ponle nombre"
              aria-label="Nombre de la melodía"
              className="mt-0.5 w-full max-w-sm border-b border-white/15 bg-transparent pb-0.5 text-lg font-black italic tracking-tight text-white outline-none placeholder:text-white/25 focus:border-white/40 md:text-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/45 transition hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canSave}
              className="rounded-full bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-white/85 disabled:opacity-30"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-4 text-white/40">
          Toca las notas en el piano, una detrás de otra. Todas duran lo mismo,
          y «Silencio» deja un pulso sin cantar. Luego la cantas como cualquier
          ejercicio: a tu altura y a tu velocidad.
        </p>

        {/* Las notas tal y como se han tocado. */}
        <div className="mt-4 flex min-h-6 flex-wrap gap-1">
          {notes.length === 0 ? (
            <span className="text-[10px] text-white/25">Aún no hay notas.</span>
          ) : (
            notes.map((note, index) =>
              note === null ? (
                <span
                  key={index}
                  title="Silencio"
                  className={`grid h-6 min-w-6 place-items-center rounded-md border border-dashed px-1.5 text-[10px] font-black ${
                    index === notes.length - 1
                      ? "border-white/60 text-white/80"
                      : "border-white/15 text-white/30"
                  }`}
                >
                  —
                </span>
              ) : (
                <span
                  key={index}
                  className={`grid h-6 min-w-6 place-items-center rounded-md px-1.5 text-[10px] font-black ${
                    index === notes.length - 1 ? "bg-white text-slate-950" : "bg-white/5 text-white/45"
                  }`}
                >
                  {fullNoteName(note)}
                </span>
              ),
            )
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setNotes((current) => current.slice(0, -1))}
            disabled={notes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-25"
          >
            <Delete size={13} /> Quitar la última
          </button>
          <button
            type="button"
            onClick={() => setNotes([])}
            disabled={notes.length === 0}
            className="rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-25"
          >
            Empezar de cero
          </button>
          <span className="ml-auto text-[10px] font-black text-white/25">
            {notes.length} / {MAX_MELODY_NOTES}
          </span>
        </div>

        {/* La velocidad a un lado y el silencio al otro: el silencio se pulsa
            mientras se va tocando, así que va abajo a la derecha, pegado al
            piano, y no entre los botones de borrar. */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="w-40">
            <Field label="Velocidad">
              <Stepper
                value={`${tempo} bpm`}
                onDown={() => setTempo((value) => Math.max(MIN_BPM, value - 4))}
                onUp={() => setTempo((value) => Math.min(MAX_BPM, value + 4))}
                downLabel="Más lento"
                upLabel="Más rápido"
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={addRest}
            disabled={full}
            title="Un pulso sin cantar"
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/30 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/75 transition hover:border-white/60 hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-25"
          >
            <Plus size={12} strokeWidth={3} /> Silencio
          </button>
        </div>

        {error && <p className="mt-2 text-[11px] text-rose-300">{error}</p>}

        {melody && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-rose-300/60 transition hover:bg-rose-400/10 hover:text-rose-300"
          >
            <Trash2 size={13} /> Borrar melodía
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 backdrop-blur-sm md:p-4">
        <PianoKeyboard
          from={MELODY_LOWEST}
          octaves={2}
          onPress={add}
          marks={last === undefined || last === null ? {} : { [last]: "hint" }}
          markLabels={false}
          showLabels
          compact
        />
        {full && (
          <p className="mt-2 text-center text-[10px] text-white/35">
            Ya tiene {MAX_MELODY_NOTES} notas, que es el máximo.
          </p>
        )}
      </div>
    </section>
  );
}
