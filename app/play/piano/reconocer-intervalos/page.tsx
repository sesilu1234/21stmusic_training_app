"use client";

import { CircleDot, Ear, Music4, Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { PIANO_INTERVAL_LEVELS } from "@/lib/pianoIntervals";

const levelIcons = [CircleDot, Music4, Ear, Sparkles];

export default function PianoReconocerMenuPage() {
  return (
    <SubMenu
      eyebrow="Reconoce el intervalo"
      title="Elige el nivel"
      intro="Se encienden dos teclas del piano y tú dices qué distancia hay entre ellas. Es el modo de al lado dado la vuelta: aquí no buscas la tecla, la miras y la mides."
      category="piano"
      options={PIANO_INTERVAL_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/piano/reconocer-intervalos/${level.slug}`,
        Icon: levelIcons[index] ?? Ear,
        badge: level.badge,
      }))}
    />
  );
}
