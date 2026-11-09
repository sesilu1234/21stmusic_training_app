"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

/**
 * El enlace de un examen: al pincharlo se copia, y al lado va el de WhatsApp.
 * Se enseña el enlace y no el código suelto porque es lo que se pasa: quien lo
 * recibe solo tiene que tocarlo.
 */
export default function ShareCode({ code, title }: { code: string; title: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const link = `${origin}/e/${code}`;
  const message = `Examen «${title}» en 21st Century Music: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Sin permiso para el portapapeles: el enlace está a la vista igualmente.
    }
  };

  return (
    <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">Enlace</p>
      <button
        type="button"
        onClick={copy}
        title="Copiar el enlace"
        className="group mt-1.5 flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-left transition hover:border-amber-300/50"
      >
        <span className="min-w-0 flex-1 truncate font-mono text-sm font-bold text-amber-100 md:text-base">
          {origin ? link.replace(/^https?:\/\//, "") : `…/e/${code}`}
        </span>
        <span
          className={`flex flex-shrink-0 items-center gap-1.5 text-xs font-black ${
            copied ? "text-emerald-300" : "text-white/55 group-hover:text-white"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </span>
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-300/30 bg-emerald-400/15 px-3.5 py-2 text-xs font-black text-emerald-100 transition hover:border-emerald-300/60"
      >
        <MessageCircle size={14} />
        WhatsApp
      </a>
    </div>
  );
}
