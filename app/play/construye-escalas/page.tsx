"use client";

import { Gem, Sparkles, TrendingUp, Waves, Waypoints } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { ESCALA_NIVELES } from "@/lib/noteSpelling";

const levelIcons = [TrendingUp, Waves, Waypoints, Sparkles, Gem];

export default function EscalasMenuPage() {
  return (
    <SubMenu
      eyebrow="Construye la escala"
      title="Elige el nivel"
      intro="Sale el nombre de una escala y la dices entera, subiendo desde la tónica. Siete notas y siete letras: cada letra se usa una vez, así que aquí Fa# y Solb no son la misma respuesta."
      category="lenguaje"
      options={ESCALA_NIVELES.map((nivel, index) => ({
        title: nivel.title,
        description: nivel.desc,
        href: `/play/construye-escalas/${nivel.slug}`,
        Icon: levelIcons[index] ?? Waves,
        badge: nivel.badge,
      }))}
    />
  );
}
