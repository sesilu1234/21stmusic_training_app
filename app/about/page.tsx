import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";
import Link from "next/link";
import PaperShell, { DISPLAY_FONT } from "../components/PaperShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sobre la app",
  description:
    "Qué es esta app, qué modos de entrenamiento tiene y cómo se usa en la escuela 21st Century Music.",
  alternates: { canonical: `${SITE_URL}/about` },
};

/**
 * Aquí no se usa `PaperTitle`: su titular es de portada — cursiva, dos líneas y
 * hasta 48px — y para una página que solo explica qué es esto sonaba a manifiesto.
 * El titular local es una línea, en redonda y del tamaño del texto grande; toda
 * la jerarquía la llevan el aire y el color, no el cuerpo de letra.
 */
export default function AboutPage() {
  return (
    <PaperShell>
      <header className="mb-10 md:mb-12">
        <h1
          className="text-2xl leading-tight tracking-tight text-white md:text-3xl"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          Sobre la app
        </h1>
      </header>

      {/* Todos los párrafos del mismo tamaño: la entradilla grande de antes
          empujaba el resto a parecer letra pequeña. */}
      <div className="space-y-5 text-[15px] leading-7 text-white/70 md:text-base md:leading-8">
        <p>
          Esta app es la parte de repetir. Lo que se explica en clase se entiende
          rápido y se olvida igual de rápido: lo que lo fija es volver sobre ello
          a menudo y en ratos cortos.
        </p>

        <p>
          Cubre armaduras, intervalos, las notas del mástil, los modos, el ritmo y
          el oído. Cada ejercicio dura unos minutos y corrige al momento, así que
          cabe en cualquier hueco y no hay nada que preparar.
        </p>

        <p>
          No sustituye al profesor ni a la clase. Es el sitio donde practicar
          entre una y otra, a tu ritmo y las veces que haga falta.
        </p>

        <p>
          La hacemos en la {SITE.academyName} y la seguimos ampliando. Si algo
          falla o echas de menos un ejercicio,{" "}
          <Link
            href="/contact"
            className="text-amber-300/90 underline decoration-amber-300/30 underline-offset-4 transition hover:decoration-amber-300"
          >
            cuéntanoslo
          </Link>
          : casi siempre acaba dentro.
        </p>
      </div>

      {/* Escuela y fundación son el mismo dato — de dónde sale esto —, así que
          van en un bloque con la rayita dentro y no separados por media página.
          "Fundada" en femenino: el sujeto es la escuela, que está justo encima. */}
      <div className="mt-14 space-y-2.5 md:mt-16">
        <a
          href={SITE.academyUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-white/40 underline-offset-8 transition-colors hover:text-amber-300 hover:underline"
        >
          {SITE.academyName} ↗
        </a>

        <div aria-hidden className="h-px w-10 bg-white/10" />

        <p
          className="text-sm italic leading-6 text-white/25 md:text-base"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          Fundada por Jaume Pla Soler en 1998
        </p>
      </div>
    </PaperShell>
  );
}
