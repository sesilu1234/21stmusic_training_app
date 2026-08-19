"use client";

import { Guitar, Music2 } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";

export default function IntervalosMenuPage() {
  return (
    <SubMenu
      eyebrow="Intervalos"
      title="Elige dónde leerlos"
      intro="El mismo intervalo, visto de dos maneras distintas."
      category="lenguaje"
      options={[
        {
          title: "En el diapasón",
          description: "Identifica el intervalo viendo las dos posiciones en el mástil.",
          href: "/play/intervalos/diapason",
          Icon: Guitar,
        },
        {
          title: "En el pentagrama",
          description: "Reconoce el intervalo leyendo las dos notas escritas.",
          href: "/play/intervalos/pentagrama",
          Icon: Music2,
        },
      ]}
    />
  );
}
