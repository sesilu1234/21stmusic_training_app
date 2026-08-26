"use client";

import { Hash, Layers, Music4, Shuffle, Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { CHORD_NAME_LEVELS } from "@/lib/staffChords";

const levelIcons = [Music4, Sparkles, Layers, Hash, Shuffle];

export default function NombrarAcordeMenuPage() {
  return (
    <SubMenu
      eyebrow="Nombra el acorde"
      title="Elige el nivel"
      intro="Salen tres o cuatro notas apiladas en el pentagrama y dices qué acorde forman: primero la fundamental, después la especie."
      category="lenguaje"
      options={CHORD_NAME_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/acordes-pentagrama/nombrar/${level.slug}`,
        Icon: levelIcons[index] ?? Layers,
        badge: level.badge,
      }))}
    />
  );
}
