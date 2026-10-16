"use client";

import { useState, useTransition } from "react";
import { toggleHonor } from "./actions";

/**
 * Salir o no en el cuadro de honor. Es un ajuste, así que va en una línea al
 * pie y no encima del cuadro: lo primero que se ve es la clasificación.
 */
export default function HonorToggle({ initial, name }: { initial: boolean; name: string }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const change = () => {
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

  const button = (label: string) => (
    <button
      type="button"
      onClick={change}
      disabled={pending}
      className="font-bold text-amber-300 underline decoration-amber-300/40 underline-offset-2 transition-colors hover:text-amber-200 disabled:opacity-60"
    >
      {label}
    </button>
  );

  return (
    <p className="text-xs text-white/60">
      {on ? (
        <>
          Sales como <span className="font-bold text-white">{name}</span> · {button("Dejar de salir")}
        </>
      ) : (
        <>No sales en el cuadro · {button(`Salir como ${name}`)}</>
      )}
      {error && <span className="ml-2 text-rose-300">{error}</span>}
    </p>
  );
}
