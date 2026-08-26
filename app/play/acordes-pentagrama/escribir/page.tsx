"use client";

import { Hash, Layers, Music4, Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { CHORD_SPELL_LEVELS } from "@/lib/staffChords";

const levelIcons = [Music4, Sparkles, Layers, Hash];

export default function EscribirAcordeMenuPage() {
  return (
    <SubMenu
      eyebrow="Escribe el acorde"
      title="Elige el nivel"
      intro="Sale el nombre de un acorde y dices sus notas una a una. Van apareciendo en el pentagrama según las eliges, así que se ve el acorde montarse."
      category="lenguaje"
      options={CHORD_SPELL_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/acordes-pentagrama/escribir/${level.slug}`,
        Icon: levelIcons[index] ?? Layers,
        badge: level.badge,
      }))}
    />
  );
}
