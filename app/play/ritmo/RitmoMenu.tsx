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
      layout="accordion"
      groups={[
        { id: "basico", title: "Lo básico", description: "Negras, blancas y corcheas: cogerle el sitio al pulso." },
        { id: "subdivision", title: "Fuera del pulso", description: "Puntillos, síncopas y semicorcheas." },
        { id: "tresillos", title: "Tresillos y todo", description: "Tres donde iban dos, y al final todo mezclado." },
      ]}
      options={RHYTHM_LEVELS.map((level, index) => ({
        title: level.title,
        description: level.desc,
        href: `/play/ritmo/${level.slug}`,
        Icon: levelIcons[index] ?? Drum,
        badge: level.badge,
        group: index < 2 ? "basico" : index < 4 ? "subdivision" : "tresillos",
        locked: !signedIn && isStudentsOnlyLevel("/play/ritmo", level.slug),
      }))}
    />
  );
}
