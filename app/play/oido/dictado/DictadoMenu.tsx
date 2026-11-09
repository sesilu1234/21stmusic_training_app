"use client";

import { ArrowDown, ArrowUp, Shuffle, Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { isStudentsOnlyLevel } from "@/lib/games";
import { MELODY_LEVELS } from "@/lib/melodyEar";

const levelIcons = [ArrowUp, ArrowDown, Shuffle, Sparkles];

export default function DictadoMenu({ signedIn }: { signedIn: boolean }) {
  return (
    <SubMenu
      eyebrow="Dictado melódico"
      title="Elige el nivel"
      intro="Suena el acorde de la tonalidad y detrás una melodía corta. La primera nota va dada y las demás las sacas tocándolas en el piano. Todas las notas salen de la escala: no hay cromatismos."
      category="oido"
      layout="accordion"
      groups={[
        { id: "tres", title: "Tres notas", description: "Melodías cortas con dirección fija: primero subiendo, luego bajando." },
        { id: "libre", title: "Libre", description: "Cuatro y cinco notas, en cualquier dirección." },
      ]}
      options={MELODY_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/oido/dictado/${level.slug}`,
        Icon: levelIcons[index] ?? Shuffle,
        badge: level.badge,
        group: index < 2 ? "tres" : "libre",
        locked: !signedIn && isStudentsOnlyLevel("/play/oido/dictado", level.slug),
      }))}
    />
  );
}
