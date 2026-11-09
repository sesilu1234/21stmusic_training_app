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
      intro="Sale el nombre de una escala y la dices entera, subiendo desde la tónica. Siete notas y siete letras: cada letra se usa una vez, así que aquí Fa# y Sol♭ no son la misma respuesta."
      category="lenguaje"
      layout="accordion"
      groups={[
        { id: "mayores", title: "Mayores y menores", description: "Las escalas de siempre: primero las mayores, después las tres menores." },
        { id: "otras", title: "Modos y otras escalas", description: "Los siete modos griegos y escalas de todo tipo y tamaño." },
      ]}
      options={ESCALA_NIVELES.map((nivel, index) => ({
        title: nivel.title,
        description: nivel.desc,
        href: `/play/construye-escalas/${nivel.slug}`,
        Icon: levelIcons[index] ?? Waves,
        badge: nivel.badge,
        group: index < 3 ? "mayores" : "otras",
      }))}
    />
  );
}
