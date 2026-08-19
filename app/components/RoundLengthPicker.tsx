"use client";

import { useEffect, useState } from "react";
import { MEDAL_MIN_LENGTH } from "@/lib/medals";
import {
  DEFAULT_ROUND_LENGTH,
  getStoredRoundLength,
  ROUND_LENGTHS,
  setStoredRoundLength,
  type RoundLength,
} from "@/lib/roundLength";

/**
 * Elegir cuántas preguntas tiene la siguiente partida. Guarda y recarga,
 * porque cambiar la longitud a mitad de ronda no tiene sentido.
 */
export default function RoundLengthPicker({ onPick }: { onPick?: () => void }) {
  const [current, setCurrent] = useState<RoundLength>(DEFAULT_ROUND_LENGTH);

  useEffect(() => {
    const readStored = () => setCurrent(getStoredRoundLength());
    readStored();
  }, []);

  const pick = (length: RoundLength) => {
    setStoredRoundLength(length);
    setCurrent(length);
    if (onPick) onPick();
    else window.location.reload();
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1">
        {ROUND_LENGTHS.map((length) => (
          <button
            key={length}
            type="button"
            onClick={() => pick(length)}
            className={`flex-1 rounded-xl py-2 text-[11px] font-black uppercase tracking-wider transition ${
              current === length
                ? "bg-amber-300 text-slate-950"
                : "text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            {length}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[9px] uppercase tracking-[0.18em] text-white/30">
        Preguntas · medalla desde {MEDAL_MIN_LENGTH}
      </p>
    </div>
  );
}
