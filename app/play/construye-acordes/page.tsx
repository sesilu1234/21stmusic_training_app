"use client";

import { Layers, Shapes, Sparkles, Triangle } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { ACORDE_NIVELES } from "@/lib/noteSpelling";

const levelIcons = [Triangle, Shapes, Layers, Sparkles];

export default function AcordesMenuPage() {
  return (
    <SubMenu
      eyebrow="Construye el acorde"
      title="Elige el nivel"
      intro="Sale el cifrado de un acorde y lo deletreas de abajo arriba. Va por terceras, así que las letras saltan de dos en dos: Do, Mi, Sol."
      category="lenguaje"
      options={ACORDE_NIVELES.map((nivel, index) => ({
        title: nivel.title,
        description: nivel.desc,
        href: `/play/construye-acordes/${nivel.slug}`,
        Icon: levelIcons[index] ?? Layers,
        badge: nivel.badge,
      }))}
    />
  );
}
