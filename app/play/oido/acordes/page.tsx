"use client";

import { Circle, CircleDot, Layers, Sparkles, Waves } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { CHORD_LEVELS } from "@/lib/chordEar";

const levelIcons = [Circle, CircleDot, Waves, Layers, Sparkles];

export default function AcordesOidoMenuPage() {
  return (
    <SubMenu
      eyebrow="Acordes al oído"
      title="Elige el nivel"
      intro="Empieza por el 1 aunque te parezca fácil: los niveles de grados dan primero la tónica, y acostumbrarse a esa referencia es justo lo que hace falta para sacar canciones."
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
