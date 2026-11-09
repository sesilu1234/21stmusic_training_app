"use client";

import { ArrowUpDown, Circle, Layers, Shuffle, Sparkles, Stethoscope } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { CHORD_LEVELS } from "@/lib/chordEar";
import { PAIR_LEVELS } from "@/lib/chordPair";
import { isStudentsOnlyLevel } from "@/lib/games";

const levelIcons = [Circle, Layers, Sparkles, Shuffle, Stethoscope];

const locked = (signedIn: boolean, slug: string) =>
  !signedIn && isStudentsOnlyLevel("/play/oido/acordes", slug);

export default function AcordesMenu({ signedIn }: { signedIn: boolean }) {
  return (
    <SubMenu
      eyebrow="Acordes al oído"
      title="Elige el nivel"
      intro="Aquí suena un acorde suelto y hay que decir de qué tipo es, sin más pistas. Si lo que quieres es sacar canciones, el modo de al lado (Progresiones) es el que te interesa."
      category="oido"
      layout="accordion"
      groups={[
        { id: "uno", title: "Un acorde suelto", description: "Suena un acorde y dices de qué tipo es. Al final, también qué hay en el bajo." },
        { id: "dos", title: "Dos acordes", description: "Suenan dos seguidos y dices cuáles son." },
      ]}
      options={[
        ...CHORD_LEVELS.map((level, index) => ({
          title: level.title,
          description: level.desc,
          href: `/play/oido/acordes/${level.slug}`,
          Icon: levelIcons[index] ?? Layers,
          badge: level.badge,
          group: "uno",
          locked: locked(signedIn, level.slug),
        })),
        ...PAIR_LEVELS.map((level) => ({
          title: level.title,
          description: level.desc,
          href: `/play/oido/acordes/${level.slug}`,
          Icon: ArrowUpDown,
          badge: level.badge,
          group: "dos",
          locked: locked(signedIn, level.slug),
        })),
      ]}
    />
  );
}
