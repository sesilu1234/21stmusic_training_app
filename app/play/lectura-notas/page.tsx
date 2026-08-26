"use client";

import { Hash, Layers, Music4, Sparkles, Waypoints } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { NOTE_READING_LEVELS } from "@/lib/noteReading";

const levelIcons = [Music4, Sparkles, Waypoints, Hash, Layers];

export default function LecturaNotasMenuPage() {
  return (
    <SubMenu
      eyebrow="Lectura de notas"
      title="Elige el nivel"
      intro="Sale una nota escrita en el pentagrama y dices cómo se llama. La octava da igual: lo que se pregunta es el nombre de la nota, tal y como está escrita."
      category="lenguaje"
      options={NOTE_READING_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/lectura-notas/${level.slug}`,
        Icon: levelIcons[index] ?? Music4,
        badge: level.badge,
      }))}
    />
  );
}
