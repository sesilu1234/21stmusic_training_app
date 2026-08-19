"use client";

import { Headphones, Layers } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";

export default function OidoMenuPage() {
  return (
    <SubMenu
      eyebrow="Oído"
      title="Intervalos al oído"
      intro="Dos notas y una pregunta: qué distancia hay entre ellas."
      category="oido"
      options={[
        {
          title: "Melódicos",
          description: "Las dos notas suenan una detrás de otra. Es por donde se empieza.",
          href: "/play/oido/intervalos",
          Icon: Headphones,
        },
        {
          title: "Armónicos",
          description: "Las dos notas suenan a la vez. Cuesta más separarlas.",
          href: "/play/oido/armonico",
          Icon: Layers,
        },
      ]}
    />
  );
}
