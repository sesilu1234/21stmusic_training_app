"use client";

import { Grip, Layers } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";

export default function AcordesMenuPage() {
  return (
    <SubMenu
      eyebrow="Acordes en el mástil"
      title="Elige el tipo"
      intro="Reconoce el acorde por su forma sobre el diapasón."
      category="guitarra"
      layout="accordion"
      groups={[
        { id: "tipo", title: "Tipo de acorde", description: "Tríadas para empezar, séptimas cuando ya salen solas." },
      ]}
      options={[
        {
          title: "Tríadas",
          description: "Mayores, menores, aumentados y disminuidos.",
          href: "/play/diapason_acordes/triadas",
          Icon: Grip,
          badge: "Inicial",
        },
        {
          title: "Séptimas",
          description: "Maj7, m7, dominante 7 y semidisminuido.",
          href: "/play/diapason_acordes/septimas",
          Icon: Layers,
          badge: "Avanzado",
        },
      ]}
    />
  );
}
