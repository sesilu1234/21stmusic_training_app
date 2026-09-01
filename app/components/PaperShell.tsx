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
      <div aria-hidden className="paper-scrim fixed inset-0 z-0" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* El "volver" va en absoluto y no en el flujo: ocupando su línea,
            empujaba el título casi 200px hacia abajo y al abrir la página no se
            leía nada de un golpe de vista. Flotando, el texto empieza arriba y
            el enlace sigue donde se le busca. */}
        <Link
          href="/"
          className="absolute left-6 top-6 z-20 text-[10px] font-bold uppercase tracking-[0.28em] text-white/35 underline-offset-8 transition-colors hover:text-amber-300 hover:underline md:left-10 md:top-8"
        >
          ← Volver
        </Link>

        <main className="flex-1 px-6 pb-16 pt-16 md:px-12 md:pb-20 md:pt-20">
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
    <header className="mb-8 md:mb-10">
      {eyebrow && (
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.32em] text-amber-300/70">
          {eyebrow}
        </p>
      )}
      <h1
        className="text-3xl italic leading-[1.1] tracking-tight text-white md:text-5xl"
        style={{ fontFamily: DISPLAY_FONT }}
      >
        {children}
      </h1>
    </header>
  );
}
