"use client";

import {
  BookOpen,
  Disc3,
  Guitar,
  ListMusic,
  MapPin,
  Mic,
  Music2,
  Piano,
  Shuffle,
  Users,
  Zap,
} from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { TRIVIA_TOPICS } from "@/lib/trivia";
import { ROUND_LENGTH } from "@/lib/roundLength";

/**
 * El menú de temas del trivial.
 *
 * Es de cliente porque los iconos son componentes y esos no se pueden mandar
 * desde el servidor. Los números sí vienen de allí: son datos normales.
 */

const ICONS: Record<string, React.ElementType> = {
  general: Shuffle,
  guitarra: Guitar,
  amplificacion: Zap,
  teclados: Piano,
  instrumentos: Music2,
  orquesta: Users,
  grabacion: Mic,
  lenguaje: BookOpen,
  historia: Disc3,
  generos: ListMusic,
  espana: MapPin,
};

export default function TriviaMenu({ counts }: { counts: Record<string, number> }) {
  return (
    <SubMenu
      eyebrow="Trivial"
      title="Elige el tema"
      intro="Veinticuatro preguntas de un tema. Cada tema tiene su propia medalla, así que para rematar el trivial hay que bordarlos todos."
      category="extras"
      options={TRIVIA_TOPICS.map((topic) => {
        const total = counts[topic.slug] ?? 0;

        return {
          title: topic.title,
          description: topic.desc,
          href: `/play/trivia/${topic.slug}`,
          Icon: ICONS[topic.slug] ?? Music2,
          /*
            El número de preguntas se enseña solo cuando el tema todavía no
            llega para una partida entera. Si llega, el dato no le importa a
            nadie; si no llega, es la diferencia entre entender por qué la
            partida es corta y pensar que algo está roto.
          */
          badge: total < ROUND_LENGTH ? `${total} preguntas` : undefined,
        };
      })}
    />
  );
}
