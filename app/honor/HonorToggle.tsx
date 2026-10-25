"use client";

import { useEffect, useState, useTransition } from "react";
import { Trophy } from "lucide-react";
import { getHonorSetting, toggleHonor } from "./actions";

/**
 * "Aparecer en el cuadro de honor", en el menú de usuario.
 *
 * El menú se pinta en todas las páginas y no trae este dato de serie, así que
 * se pregunta al abrirlo. Hasta que llega, el interruptor sale apagado y
 * quieto: mejor un instante sin poder tocarlo que enseñar algo que no es.
 */
export default function HonorToggle() {
  const [on, setOn] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    getHonorSetting()
      .then((result) => {
        if (alive && result.ok) setOn(result.on);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const change = () => {
    if (on === null) return;
    const next = !on;
    setOn(next);
    setError(null);
    startTransition(async () => {
      const result = await toggleHonor(next);
      if (!result.ok) {
        setOn(!next);
        setError(result.error);
      }
    });
  };

  return (
    <div className="px-3 py-2">
      <button
        type="button"
        role="switch"
        aria-checked={on === true}
        onClick={change}
        disabled={on === null || pending}
        className="flex w-full items-center gap-3 text-left text-xs font-bold text-white/50 transition hover:text-white disabled:cursor-default"
      >
        <Trophy size={16} strokeWidth={1.75} className="flex-shrink-0" />
        <span className="min-w-0 flex-1 leading-tight">Aparecer en el cuadro de honor</span>
        <span
          aria-hidden
          className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
            on ? "bg-amber-400" : "bg-white/15"
          } ${on === null ? "opacity-40" : ""}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
              on ? "left-[1.125rem]" : "left-0.5"
            }`}
          />
        </span>
      </button>
      {error && <p className="mt-1 pl-7 text-[11px] text-rose-300">{error}</p>}
    </div>
  );
}
