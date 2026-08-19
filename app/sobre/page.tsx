import Link from "next/link";
import { ExternalLink } from "lucide-react";
import InfoShell, { InfoSection } from "../components/InfoShell";
import { GAMES } from "@/lib/games";
import { SITE } from "@/lib/site";

export const metadata = { title: "Sobre la app · 21st Century Music" };

export default function SobrePage() {
  return (
    <InfoShell
      eyebrow="Sobre la app"
      title="Qué es esto"
      intro="Una app de entrenamiento musical hecha para los alumnos de la academia: lenguaje musical, diapasón y oído en ejercicios cortos."
    >
      <InfoSection title="La idea">
        <p>
          Lo que se explica en clase hay que repetirlo para que se quede: armaduras, intervalos,
          notas del mástil, modos, ritmo y oído. Esta app convierte esa repetición en partidas de
          pocos minutos, con corrección inmediata y una medalla por cada modo que termines con
          todos los ejercicios correctos.
        </p>
        <p>
          No sustituye a la clase ni al profesor: es el trabajo de casa, pero sin fotocopias.
        </p>
      </InfoSection>

      <InfoSection title="Modos de juego">
        <ul className="space-y-2">
          {GAMES.map((game) => (
            <li key={game.name} className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-white/90">{game.name}</span>
              <span className="text-xs text-white/45">{game.desc}</span>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="Quién está detrás">
        <p>
          La app es de {SITE.academyName}, la escuela donde se dan las clases. El desarrollo es
          propio, así que si algo falla o echas de menos un ejercicio, se puede arreglar: dilo por{" "}
          <Link href="/contacto" className="text-amber-300 underline underline-offset-2">
            contacto
          </Link>
          .
        </p>
        <a
          href={SITE.academyUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 transition hover:border-amber-300/40 hover:text-white"
        >
          {SITE.academyName}
          <ExternalLink size={14} />
        </a>
      </InfoSection>
    </InfoShell>
  );
}
