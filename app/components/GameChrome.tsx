"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Barra superior de los ejercicios: volver al menú, el enunciado y el logo,
 * los tres en la misma línea pegada al tope.
 *
 * El enunciado vivía dentro del contenedor centrado del ejercicio, así que
 * `justify-center` lo dejaba flotando en mitad de la pantalla y arriba quedaba
 * una franja muerta. Subiéndolo aquí, esa franja pasa a ser la propia pregunta.
 */
export default function GameChrome({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative z-30 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 pt-3 md:gap-5 md:px-6 md:pt-4">
      <Link
        href="/"
        className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60 backdrop-blur-sm transition hover:border-amber-300/50 hover:text-white md:px-4"
      >
        <ArrowLeft size={14} />
        <span className="hidden sm:inline">Menú</span>
      </Link>

      {children ? (
        <h1
          className="min-w-0 text-balance text-center text-base font-black italic uppercase leading-tight tracking-tighter text-white sm:text-xl md:text-3xl"
          style={{ fontFamily: "Chaney, sans-serif" }}
        >
          {children}
        </h1>
      ) : (
        <span />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo21stCM_no_white_1-192.png"
        alt=""
        aria-hidden="true"
        className="h-8 w-auto flex-shrink-0 opacity-40 drop-shadow-2xl md:h-12"
      />
    </div>
  );
}
