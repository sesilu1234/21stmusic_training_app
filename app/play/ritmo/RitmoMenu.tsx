"use client";

import { Drum, Waves, Braces, Grid2x2, Triangle, Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { isStudentsOnlyLevel } from "@/lib/games";
import { RHYTHM_LEVELS } from "@/lib/rhythm";

const levelIcons = [Drum, Waves, Braces, Grid2x2, Triangle, Sparkles];

export default function RitmoMenu({ signedIn }: { signedIn: boolean }) {
  return (
    <SubMenu
      eyebrow="Lectura rítmica"
      title="Elige el módulo"
      intro="Lee la figura, sigue el metrónomo y pulsa en el sitio exacto. Cada módulo añade una figura nueva a las del anterior."
      category="lenguaje"
      options={RHYTHM_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/ritmo/${level.slug}`,
        Icon: levelIcons[index] ?? Drum,
        badge: level.badge,
        locked: !signedIn && isStudentsOnlyLevel("/play/ritmo", level.slug),
      }))}
    />
  );
}
