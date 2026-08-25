"use client";

import { CircleDot, Music4, Piano, Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { PIANO_INTERVAL_LEVELS } from "@/lib/pianoIntervals";

const levelIcons = [CircleDot, Music4, Piano, Sparkles];

export default function PianoIntervalosMenuPage() {
  return (
    <SubMenu
      eyebrow="Toca el intervalo"
      title="Elige el nivel"
      intro="El enunciado te da una nota de partida y un intervalo: «desde Mi, toca la 5ª justa». Tú buscas la tecla. La de partida sale marcada en ámbar, así que lo único que hay que contar son los semitonos hacia arriba."
      category="piano"
      options={PIANO_INTERVAL_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/piano/intervalos/${level.slug}`,
        Icon: levelIcons[index] ?? Piano,
        badge: level.badge,
      }))}
    />
  );
}
