"use client";

import { Hash, Layers, Music4, Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { STAFF_INTERVAL_LEVELS } from "@/lib/staffIntervals";

const levelIcons = [Music4, Sparkles, Hash, Layers];

export default function IntervalosMenuPage() {
  return (
    <SubMenu
      eyebrow="Intervalos"
      title="Elige el nivel"
      intro="Salen dos notas en el pentagrama y dices qué intervalo forman. Primero se cuentan las letras, y luego los semitonos dicen si es mayor, menor, justo, aumentado o disminuido."
      category="lenguaje"
      layout="accordion"
      groups={[
        { id: "naturales", title: "Sin alteraciones", description: "Solo notas naturales: contar letras y saber dónde caen Mi-Fa y Si-Do." },
        { id: "alteraciones", title: "Con alteraciones", description: "Sostenidos y bemoles en cualquiera de las dos notas." },
      ]}
      options={STAFF_INTERVAL_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/intervalos/${level.slug}`,
        Icon: levelIcons[index] ?? Music4,
        badge: level.badge,
        group: index < 2 ? "naturales" : "alteraciones",
      }))}
    />
  );
}
