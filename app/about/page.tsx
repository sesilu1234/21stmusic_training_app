import Link from "next/link";
import PaperShell, { DISPLAY_FONT, PaperTitle } from "../components/PaperShell";
import { SITE } from "@/lib/site";

export const metadata = { title: "Sobre la app · 21st Century Music" };

export default function AboutPage() {
  return (
    <PaperShell>
      <PaperTitle eyebrow="Sobre la app">
        Que la música
        <br />
        se quede
      </PaperTitle>

      <div className="space-y-5 text-[15px] leading-7 text-white/65 md:text-base md:leading-8">
        {/* Primer párrafo algo más grande y más claro: hace de entradilla sin
            necesidad de ponerle una etiqueta encima. */}
        <p className="text-lg leading-8 text-white/85 md:text-xl md:leading-9">
          Lo que se descubre en clase necesita repetirse para asentarse. Aquí esa
          repetición se vuelve juego: partidas de tres minutos, respuesta al
          instante y ni una sola fotocopia.
        </p>

        <p>
          Armaduras, intervalos, las notas del mástil, los modos griegos, el ritmo,
          el oído. Cada ejercicio es corto a propósito, para que quepa en cualquier
          rato: en la cola del súper, entre clase y clase, en el sofá antes de
          dormir.
        </p>

        <p>
          No viene a sustituir al profesor —{" "}
          <em className="italic text-amber-200/80" style={{ fontFamily: DISPLAY_FONT }}>
            tan poco como un piano sustituye a un pianista
          </em>{" "}
          — sino a ser el sitio donde volver sobre lo aprendido: a tu ritmo, las
          veces que te apetezca y sin que nadie mire.
        </p>

        <p>
          La hacemos en la {SITE.academyName} y no para de crecer. Si algo falla, o
          echas de menos un ejercicio,{" "}
          <Link
            href="/contact"
            className="text-amber-300 underline decoration-amber-300/30 underline-offset-4 transition hover:decoration-amber-300"
          >
            cuéntanoslo
          </Link>
          : casi siempre acaba dentro.
        </p>
      </div>

      <p className="mt-8">
        <a
          href={SITE.academyUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40 underline-offset-8 transition-colors hover:text-amber-300 hover:underline"
        >
          {SITE.academyName} ↗
        </a>
      </p>

      {/* --- La dedicatoria ---------------------------------------------- */}
      {/* Va al final, apagada y sin nada que la anuncie. Una rayita corta y una
          línea en cursiva: si se le pone más peso deja de ser un homenaje y
          pasa a ser un titular. */}
      <div className="mt-16 md:mt-20">
        <div aria-hidden className="mb-6 h-px w-16 bg-white/15" />
        <p
          className="text-base italic leading-7 text-white/20 md:text-lg"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          Fundado por Jaume Pla Soler en 1998
        </p>
      </div>
    </PaperShell>
  );
}
