"use client";

import { useState, useTransition } from "react";
import { dismissHonorNotice } from "@/app/honor/actions";

/**
 * El aviso de la primera vez: sales en el cuadro de honor, con tu nombre, y
 * dónde se quita. Sale en la portada hasta que se pulsa "Entendido" (o se
 * toca el interruptor del menú), y entonces se apunta en
 * `students.honor_notice_seen_at`.
 */
export default function HonorNotice({ name }: { name: string }) {
  const [hidden, setHidden] = useState(false);
  const [pending, startTransition] = useTransition();
  if (hidden) return null;

  return (
    <div className="mb-7 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3.5 shadow-lg md:px-5">
      <p className="text-sm leading-6 text-white/85">
        🏆 Sales en el <span className="font-bold text-white">cuadro de honor</span> como{" "}
        <span className="font-bold text-amber-200">{name}</span>, y en el ranking del reto diario. Si prefieres no
        salir, quítalo en el menú de tu usuario (arriba a la derecha).
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setHidden(true);
          startTransition(() => dismissHonorNotice());
        }}
        className="mt-2.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-300"
      >
        Entendido
      </button>
    </div>
  );
}
