"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import { EAR_INTERVAL_LEVELS, type EarIntervalLevel } from "@/lib/earIntervals";

/**
 * Los niveles de intervalos al oído, en /play/oido encima de las tarjetas.
 *
 * Funciona como un grupo de radios: uno marcado siempre, se cambia con clic o
 * con las flechas, y con el tabulador se entra y se sale del grupo de una vez
 * (solo el marcado está en el orden de tabulación). El marcado no se distingue
 * solo por el color: lleva relleno, borde y una marca.
 */
export default function EarLevelSelect({
  value,
  onChange,
}: {
  value: EarIntervalLevel;
  onChange: (level: EarIntervalLevel) => void;
}) {
  const chips = useRef<(HTMLButtonElement | null)[]>([]);

  const moveTo = (index: number) => {
    const count = EAR_INTERVAL_LEVELS.length;
    const next = EAR_INTERVAL_LEVELS[(index + count) % count];
    onChange(next);
    chips.current[(index + count) % count]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: EAR_INTERVAL_LEVELS.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    moveTo(moves[event.key]);
  };

  return (
    <div className="mb-6 md:mb-7">
      <div
        role="radiogroup"
        aria-label="Nivel de los intervalos"
        aria-describedby="oido-nivel-desc"
        className="flex flex-wrap gap-2"
      >
        {EAR_INTERVAL_LEVELS.map((level, index) => {
          const active = level.id === value.id;
          return (
            <button
              key={level.id}
              ref={(node) => {
                chips.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(level)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                active
                  ? "border-violet-300 bg-violet-400/25 text-white shadow-[0_0_18px_rgba(167,139,250,0.25)]"
                  : "border-white/10 bg-slate-950/60 text-white/50 hover:border-violet-300/40 hover:text-white/80"
              }`}
            >
              {active && <Check size={13} strokeWidth={3} className="text-violet-300" />}
              {level.label}
            </button>
          );
        })}
      </div>

      <p id="oido-nivel-desc" className="mt-2.5 text-xs leading-5 text-white/40">
        {value.desc}
      </p>
    </div>
  );
}
