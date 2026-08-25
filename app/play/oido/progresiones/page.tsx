"use client";

import { CircleDot, ListMusic, Repeat, Waves } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { PROGRESSION_LEVELS } from "@/lib/chordEar";

const levelIcons = [CircleDot, Waves, Repeat, ListMusic, ListMusic];

export default function ProgresionesOidoMenuPage() {
  return (
    <SubMenu
      eyebrow="Progresiones al oído"
      title="Elige el nivel"
      intro="Suena la tónica y después los acordes de la rueda: hay que decir qué grados son, en orden. Empieza por el 1 aunque te parezca fácil, porque acostumbrarse a esa referencia es justo lo que hace falta para sacar canciones."
      category="oido"
      options={PROGRESSION_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/oido/progresiones/${level.slug}`,
        Icon: levelIcons[index] ?? ListMusic,
        badge: level.badge,
      }))}
    />
  );
}
