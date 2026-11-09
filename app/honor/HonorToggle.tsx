"use client";

import { useEffect, useState, useTransition } from "react";
import { getHonorSetting, toggleHonor } from "./actions";

/**
 * "Salir en el cuadro de honor", en el menú de usuario.
 *
 * El menú se pinta en todas las páginas y no trae este dato de serie. Antes se
 * preguntaba al abrir el menú, y el interruptor saltaba un segundo después de
 * abrirlo. Ahora se pregunta una vez, en cuanto se monta el avatar
 * (`prefetchHonorSetting`), y se queda guardado aquí: al abrir el menú ya está.
 */
let cached: boolean | null = null;
let request: Promise<boolean | null> | null = null;
/** De quién es lo guardado: si entra otra persona en la misma pestaña, se olvida. */
let owner: string | null = null;

export const prefetchHonorSetting = (who: string) => {
  if (owner !== who) {
    owner = who;
    cached = null;
    request = null;
  }
  if (cached !== null) return Promise.resolve(cached);
  request ??= getHonorSetting()
    .then((result) => {
      cached = result.ok ? result.on : null;
      return cached;
    })
    .catch(() => {
      request = null;
      return null;
    });
  return request;
};

export default function HonorToggle({ who }: { who: string }) {
  const [on, setOn] = useState<boolean | null>(owner === who ? cached : null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (on !== null) return;
    let alive = true;
    prefetchHonorSetting(who).then((value) => {
      if (alive && value !== null) setOn(value);
    });
    return () => {
      alive = false;
    };
  }, [on, who]);

  const change = () => {
    if (on === null) return;
    const next = !on;
    setOn(next);
    cached = next;
    setError(null);
    startTransition(async () => {
      const result = await toggleHonor(next);
      if (!result.ok) {
        setOn(!next);
        cached = !next;
        setError(result.error);
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={on === true}
        onClick={change}
        disabled={on === null || pending}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-white/60 transition hover:bg-white/5 hover:text-white disabled:cursor-default"
      >
        <span className="min-w-0 flex-1 leading-tight">Salir en el cuadro</span>
        {/* Hasta que llega el dato, ni encendido ni apagado: un hueco tenue. */}
        <span
          aria-hidden
          className={`relative h-4 w-7 flex-shrink-0 rounded-full transition-colors ${
            on === null ? "bg-white/10" : on ? "bg-amber-400" : "bg-white/15"
          }`}
        >
          {on !== null && (
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left] ${
                on ? "left-3.5" : "left-0.5"
              }`}
            />
          )}
        </span>
      </button>
      {error && <p className="px-2.5 pb-1 text-[10px] text-rose-300">{error}</p>}
    </div>
  );
}
