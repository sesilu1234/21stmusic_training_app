"use client";

import { Sparkles, TrendingUp, Waypoints, Waves } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { SCALE_BUILD_LEVELS } from "@/lib/pianoBuild";

const levelIcons = [TrendingUp, Waves, Waypoints, Sparkles];

export default function PianoEscalasMenuPage() {
  return (
    <SubMenu
      eyebrow="Construye escalas"
      title="Elige el nivel"
      intro="Sale el nombre de una escala y la tocas entera, subiendo desde la fundamental hasta la octava. Aquí el orden sí cuenta: una escala se toca en orden."
      category="piano"
      options={SCALE_BUILD_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/piano/escalas/${level.slug}`,
        Icon: levelIcons[index] ?? Waves,
        badge: level.badge,
      }))}
    />
  );
}
