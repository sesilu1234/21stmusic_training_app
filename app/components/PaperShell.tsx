import Link from "next/link";
import Backdrop from "./Backdrop";
import SiteFooter from "./SiteFooter";
import { infoFontVariables } from "../fonts";

/**
 * Marco de las páginas que solo son texto: sobre, contacto y privacidad.
 *
 * Se diferencia de `InfoShell` en que aquí no hay tarjetas. Ni paneles, ni
 * bordes, ni fondos de caja: el texto se apoya directamente sobre la foto. Para
 * que eso se pueda leer, encima del `Backdrop` va un velo bastante más denso
 * que en el resto de la app — el fondo se intuye, no compite.
 *
 * El velo es un color plano, sin desenfoque: es una capa fija que el navegador
 * rasteriza una vez y no vuelve a tocar mientras dure la página.
 */
export const DISPLAY_FONT = "var(--font-info-display), Georgia, 'Times New Roman', serif";
export const BODY_FONT = "var(--font-info-body), Georgia, 'Times New Roman', serif";

export default function PaperShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${infoFontVariables} relative min-h-screen overflow-x-hidden text-white`}
      style={{ fontFamily: BODY_FONT }}
    >
      <Backdrop />
      <div aria-hidden className="fixed inset-0 z-0 bg-slate-950/78" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-6 pt-8 md:px-12 md:pt-10">
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 underline-offset-8 transition-colors hover:text-amber-300 hover:underline"
          >
            ← Volver
          </Link>
        </header>

        <main className="flex-1 px-6 py-16 md:px-12 md:py-24">
          <article className="mx-auto w-full max-w-2xl">{children}</article>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

/**
 * El titular de estas páginas. Grande, en cursiva y con mucho aire por debajo:
 * es lo único que hace de portada, ya que no hay tarjeta que enmarque nada.
 */
export function PaperTitle({ eyebrow, children }: { eyebrow?: string; children: React.ReactNode }) {
  return (
    <header className="mb-14 md:mb-20">
      {eyebrow && (
        <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.32em] text-amber-300/70">
          {eyebrow}
        </p>
      )}
      <h1
        className="text-5xl italic leading-[1.05] tracking-tight text-white md:text-7xl"
        style={{ fontFamily: DISPLAY_FONT }}
      >
        {children}
      </h1>
    </header>
  );
}
