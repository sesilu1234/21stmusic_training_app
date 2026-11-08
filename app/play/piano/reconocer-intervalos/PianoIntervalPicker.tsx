"use client";

import {
  ALL_PIANO_SEMITONES,
  MIN_CUSTOM_PIANO_INTERVALS,
  PIANO_INTERVALS,
} from "@/lib/pianoIntervals";

/**
 * Qué intervalos se practican en Reconocer intervalos, encima de la tarjeta.
 * Es el mismo selector que el de Intervalos al oído, en el verde de piano.
 * Con todos marcados es el ejercicio normal, el que cuenta para la medalla.
 */
export default function PianoIntervalPicker({
  marked,
  selection,
  onChange,
}: {
  marked: number[];
  /** Con lo que se va a jugar, o null si lo marcado no llega al mínimo. */
  selection: { custom: boolean } | null;
  onChange: (marked: number[]) => void;
}) {
  const toggle = (value: number) =>
    onChange(marked.includes(value) ? marked.filter((item) => item !== value) : [...marked, value]);

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-slate-950/70 px-3.5 py-3 shadow-xl backdrop-blur-sm md:mb-7">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
          Intervalos{" "}
          <span className="font-bold tracking-normal text-white/30">
            · {marked.length} de {ALL_PIANO_SEMITONES.length}
          </span>
        </p>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onChange(ALL_PIANO_SEMITONES)}
            disabled={marked.length === ALL_PIANO_SEMITONES.length}
            className="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/45 transition hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={marked.length === 0}
            className="rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/45 transition hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            Ninguno
          </button>
        </div>
      </div>

      {/* Una fila: en el móvil no caben los doce, así que se desliza de lado. */}
      <div
        role="group"
        aria-label="Intervalos que se practican"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]"
      >
        {PIANO_INTERVALS.map((interval) => {
          const on = marked.includes(interval.semitones);
          return (
            <button
              key={interval.semitones}
              type="button"
              aria-pressed={on}
              title={interval.name}
              onClick={() => toggle(interval.semitones)}
              className={`h-8 min-w-10 flex-1 shrink-0 rounded-lg border px-2 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                on
                  ? "border-emerald-300/60 bg-emerald-400/25 text-white"
                  : "border-white/10 bg-white/3 text-white/30 hover:border-white/25 hover:text-white/70"
              }`}
            >
              {interval.short}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-4 text-white/35">
        {selection === null
          ? `Marca al menos ${MIN_CUSTOM_PIANO_INTERVALS}. Mientras tanto, se juega con todos.`
          : selection.custom
            ? "Solo salen los marcados. Así es práctica: no cuenta para el progreso."
            : "Con todos marcados es el ejercicio normal, el que cuenta para el progreso."}
      </p>
    </section>
  );
}
