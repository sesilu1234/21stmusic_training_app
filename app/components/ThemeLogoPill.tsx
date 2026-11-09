"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

/**
 * Tema y logo en una cápsula de cristal, para las cabeceras de los
 * ejercicios: la pareja del botón de volver. El logo lleva a la portada.
 *
 * Antes iban sueltos (o el logo ni estaba), y el logo a medio apagar quedaba
 * grisáceo sobre la foto.
 */
export default function ThemeLogoPill() {
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-black/40 py-0.5 pl-0.5 pr-2.5 backdrop-blur-sm md:gap-2 md:pr-3">
      <ThemeToggle inPill />
      <span aria-hidden="true" className="h-4 w-px bg-white/15 md:h-5" />
      <Link
        href="/"
        aria-label="Ir a la portada"
        title="Ir a la portada"
        className="flex-shrink-0 rounded-sm opacity-90 transition hover:opacity-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/logo21stCM_no_white_1-192.png"
          alt=""
          aria-hidden="true"
          className="h-6 w-auto md:h-7"
        />
      </Link>
    </div>
  );
}
