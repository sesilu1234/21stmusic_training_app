import Link from "next/link";
import Backdrop from "../components/Backdrop";
import { pixelFontVariables } from "../fonts";
import ContactForm from "./ContactForm";

export const metadata = { title: "Contacto · 21st Century Music" };

const PIXEL = { fontFamily: "var(--font-pixel), monospace" };

/**
 * Contacto cabe en una pantalla y no lleva pie de página.
 *
 * Es un formulario de tres campos: obligar a bajar para ver el botón de enviar
 * era pedirle al usuario que se fiara de que abajo había algo. De ahí que aquí
 * no se use `PaperShell` — ese marco es para las páginas de leer, que sí son
 * largas y sí llevan pie.
 *
 * El fondo es el de siempre pero con el velo claro (`veil-light`), aunque la app
 * esté en oscuro: aquí solo hay una caja en medio de la pantalla, y con el velo
 * oscuro la foto no se veía. Sin el velo extra que llevan las otras páginas de
 * texto, que aquí sobraba.
 *
 * `min-h-dvh` y no `h-dvh`: en el móvil, al abrir el teclado, el viewport se
 * encoge y con altura fija el formulario quedaría atrapado. Con altura mínima
 * cabe entero cuando hay sitio y se puede desplazar cuando no lo hay.
 */
export default function ContactPage() {
  return (
    <div
      className={`${pixelFontVariables} veil-light relative min-h-dvh overflow-x-hidden text-white`}
    >
      <Backdrop />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-5 py-8">
        <main className="w-full max-w-[21rem]">
          {/* Esquina redondeada, borde de un píxel y una sombra dura desplazada.
              El desplazamiento es lo que deja el aire brutalista; las esquinas
              rectas encima ya eran demasiado. */}
          <section className="rounded-2xl border border-white/15 bg-slate-950/80 p-4 shadow-[6px_6px_0_0_rgba(0,0,0,0.5)] sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h1
                className="text-base uppercase leading-none tracking-[0.06em] text-white"
                style={PIXEL}
              >
                Escríbenos
              </h1>
              <span
                className="text-[8px] uppercase tracking-[0.24em] text-amber-300"
                style={PIXEL}
              >
                Contacto
              </span>
            </div>

            <p className="mt-2 text-[11px] leading-4 text-white/40">
              Un fallo, una idea, una duda. Lo leemos todo.
            </p>

            <div className="mt-4">
              <ContactForm />
            </div>
          </section>

          {/* Pie mínimo: sin el `SiteFooter` entero no cabía en una pantalla,
              pero privacidad tiene que seguir estando a un toque. */}
          <div
            className="mt-4 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-white/40"
            style={PIXEL}
          >
            <Link href="/" className="transition-colors hover:text-amber-300">
              ← Volver
            </Link>
            <Link href="/privacidad" className="transition-colors hover:text-amber-300">
              Privacidad
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
