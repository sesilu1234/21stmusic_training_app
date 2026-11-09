"use client";

import { Music4, Piano, Sparkles, Waypoints } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { PIANO_NOTE_LEVELS } from "@/lib/pianoNotes";

const levelIcons = [Music4, Sparkles, Waypoints, Piano];

export default function PianoNotasMenuPage() {
  return (
    <SubMenu
      eyebrow="Notas en el teclado"
      title="Elige el nivel"
      intro="Sale una nota escrita en el pentagrama y la buscas en el piano. La octava cuenta: no vale tocar el Do que sea, hay que tocar el que está escrito."
      category="piano"
      layout="accordion"
      groups={[
        { id: "sol", title: "Clave de sol", description: "Primero las naturales, después con alteraciones." },
        { id: "fa", title: "Clave de fa", description: "Lo mismo en clave de fa." },
      ]}
      options={PIANO_NOTE_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/piano/notas/${level.slug}`,
        Icon: levelIcons[index] ?? Piano,
        badge: level.badge,
        group: index < 2 ? "sol" : "fa",
      }))}
    />
  );
}
