"use client";

import { Layers, Sparkles, Triangle, Boxes } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { CHORD_BUILD_LEVELS } from "@/lib/pianoBuild";

const levelIcons = [Triangle, Layers, Boxes, Sparkles];

export default function PianoAcordesMenuPage() {
  return (
    <SubMenu
      eyebrow="Construye acordes"
      title="Elige el nivel"
      intro="Sale el nombre de un acorde y lo montas tecla a tecla. El orden da igual: un acorde suena a la vez, así que lo único que importa es que estén todas sus notas y ninguna de más."
      category="piano"
      layout="accordion"
      groups={[
        { id: "triadas", title: "Tríadas", description: "Tres notas: mayores y menores, y después disminuidas y aumentadas." },
        { id: "cuatriadas", title: "Cuatríadas y todo", description: "Cuatro notas, y al final todo mezclado desde cualquier tecla." },
      ]}
      options={CHORD_BUILD_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/piano/acordes/${level.slug}`,
        Icon: levelIcons[index] ?? Layers,
        badge: level.badge,
        group: index < 2 ? "triadas" : "cuatriadas",
      }))}
    />
  );
}
