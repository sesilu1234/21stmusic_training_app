"use client";

import { ArrowUpDown, Circle, Layers, Shuffle, Sparkles, Stethoscope } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { CHORD_LEVELS } from "@/lib/chordEar";
import { PAIR_LEVEL } from "@/lib/chordPair";
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
      options={[
        ...CHORD_LEVELS.map((level, index) => ({
          title: level.title,
          description: level.desc,
          href: `/play/oido/acordes/${level.slug}`,
          Icon: levelIcons[index] ?? Layers,
          badge: level.badge,
          locked: locked(signedIn, level.slug),
        })),
        {
          title: PAIR_LEVEL.title,
          description: PAIR_LEVEL.desc,
          href: `/play/oido/acordes/${PAIR_LEVEL.slug}`,
          Icon: ArrowUpDown,
          badge: PAIR_LEVEL.badge,
          locked: locked(signedIn, PAIR_LEVEL.slug),
        },
      ]}
    />
  );
}
