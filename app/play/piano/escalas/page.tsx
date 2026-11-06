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
      layout="accordion"
      groups={[
        { id: "mayor", title: "Mayor y menor", description: "Las escalas de siempre, tecla a tecla." },
        { id: "mas", title: "Pentatónicas y todas", description: "Las pentatónicas, y después cualquier escala desde cualquier tecla." },
      ]}
      options={SCALE_BUILD_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/piano/escalas/${level.slug}`,
        Icon: levelIcons[index] ?? Waves,
        badge: level.badge,
        group: index < 2 ? "mayor" : "mas",
      }))}
    />
  );
}
