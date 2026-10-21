"use client";

import { ALL_EAR_INTERVALS, MIN_CUSTOM_INTERVALS, type EarIntervalSet } from "@/lib/earIntervals";

/** El nombre largo de cada uno, para el título al pasar por encima. */
const LONG_NAMES: Record<string, string> = {
  Unísono: "Unísono",
  b2: "2ª menor",
  "2": "2ª mayor",
  b3: "3ª menor",
  "3": "3ª mayor",
  "4": "4ª justa",
  b5: "Tritono",
  "5": "5ª justa",
  b6: "6ª menor",
  "6": "6ª mayor",
  b7: "7ª menor",
  "7": "7ª mayor",
  "8va": "8ª justa",
};

/**
 * Qué intervalos se practican, en /play/oido encima de las tarjetas.
 *
 * Una tarjeta baja, como las de debajo y no suelta sobre la foto, con los
 * trece en una sola fila. Con todos marcados es el ejercicio normal, el que
 * cuenta para el progreso y la medalla; con menos es práctica.
 */
export default function EarIntervalPicker({
  marked,
  set,
  onChange,
}: {
  marked: string[];
  /** Con lo que se va a jugar, o null si lo marcado no llega al mínimo. */
  set: EarIntervalSet | null;
  onChange: (marked: string[]) => void;
}) {
  const toggle = (name: string) =>
    onChange(marked.includes(name) ? marked.filter((item) => item !== name) : [...marked, name]);

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-slate-950/70 px-3.5 py-3 shadow-xl backdrop-blur-sm md:mb-7">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
          Intervalos <span className="font-bold tracking-normal text-white/30">· {marked.length} de {ALL_EAR_INTERVALS.length}</span>
        </p>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onChange(ALL_EAR_INTERVALS)}
            disabled={marked.length === ALL_EAR_INTERVALS.length}
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

      {/* Una fila: en el móvil no caben los trece, así que se desliza de lado. */}
      <div
        role="group"
        aria-label="Intervalos que se practican"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]"
      >
        {ALL_EAR_INTERVALS.map((name) => {
          const on = marked.includes(name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              title={LONG_NAMES[name]}
              onClick={() => toggle(name)}
              className={`h-8 min-w-10 flex-1 shrink-0 rounded-lg border px-2 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
                on
                  ? "border-violet-300/60 bg-violet-400/25 text-white"
                  : "border-white/10 bg-white/3 text-white/30 hover:border-white/25 hover:text-white/70"
              }`}
            >
              {name === "Unísono" ? "1" : name}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-4 text-white/35">
        {set === null
          ? `Marca al menos ${MIN_CUSTOM_INTERVALS} (sin contar el unísono). Mientras tanto, se juega con todos.`
          : set.custom
            ? "Solo salen los marcados. Así es práctica: no cuenta para el progreso."
            : "Con todos marcados es el ejercicio normal, el que cuenta para el progreso."}
      </p>
    </section>
  );
}
