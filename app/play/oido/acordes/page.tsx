"use client";

import { Circle, Layers, Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { CHORD_LEVELS } from "@/lib/chordEar";

const levelIcons = [Circle, Layers, Sparkles];

export default function AcordesOidoMenuPage() {
  return (
    <SubMenu
      eyebrow="Acordes al oído"
      title="Elige el nivel"
      intro="Aquí suena un acorde suelto y hay que decir de qué tipo es, sin más pistas. Si lo que quieres es sacar canciones, el modo de al lado (Progresiones) es el que te interesa."
      category="oido"
      options={CHORD_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/oido/acordes/${level.slug}`,
        Icon: levelIcons[index] ?? Layers,
        badge: level.badge,
      }))}
    />
  );
}
