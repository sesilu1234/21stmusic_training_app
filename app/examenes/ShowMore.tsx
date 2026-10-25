"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/** Cuántas se ven de entrada, y cuántas más con cada "Mostrar más". */
const PAGE = 5;

/**
 * Una lista que enseña cinco y el resto bajo un botón. Las filas llegan ya
 * pintadas desde el servidor; aquí solo se decide cuántas se ven.
 */
export default function ShowMore({ items, accent }: { items: React.ReactNode[]; accent: string }) {
  const [shown, setShown] = useState(PAGE);
  const left = items.length - shown;

  return (
    <>
      <ul className="space-y-2">{items.slice(0, shown)}</ul>
      {left > 0 && (
        <button
          type="button"
          onClick={() => setShown(shown + PAGE)}
          className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-slate-950/70 py-2.5 text-xs font-bold transition hover:border-amber-300/40 ${accent}`}
        >
          Mostrar más <span className="font-normal opacity-70">({left})</span>
          <ChevronDown size={14} />
        </button>
      )}
    </>
  );
}
