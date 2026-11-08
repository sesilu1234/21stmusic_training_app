"use client";

import { Hash, Layers, Music4, Sparkles, Timer, Waypoints } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { NOTE_READING_LEVELS } from "@/lib/noteReading";
import { NOTE_SPRINT_LEVELS } from "@/lib/noteSprint";

const levelIcons = [Music4, Sparkles, Waypoints, Hash, Hash, Layers];

export default function LecturaNotasMenuPage() {
  return (
    <SubMenu
      eyebrow="Lectura de notas"
      title="Elige el nivel"
      intro="Sale una nota escrita en el pentagrama y dices cómo se llama. La octava da igual: lo que se pregunta es el nombre de la nota, tal y como está escrita."
      category="lenguaje"
      layout="accordion"
      groups={[
        {
          id: "nota",
          title: "Nota a nota",
          description: "Una nota cada vez, sin reloj. Seis niveles de menos a más.",
        },
        {
          id: "sprint",
          title: "Contrarreloj",
          description: "Ristras de notas contra el tiempo: leer de corrido.",
        },
      ]}
      options={[
        ...NOTE_READING_LEVELS.map((level, index) => ({
          title: level.title,
          description: level.desc,
          href: `/play/lectura-notas/${level.slug}`,
          Icon: levelIcons[index] ?? Music4,
          badge: level.badge,
          group: "nota",
        })),
        ...NOTE_SPRINT_LEVELS.map((level) => ({
          title: level.title,
          description: level.desc,
          href: `/play/lectura-notas/${level.slug}`,
          Icon: Timer,
          badge: level.badge,
          group: "sprint",
        })),
      ]}
    />
  );
}
