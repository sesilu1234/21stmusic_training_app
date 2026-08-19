"use client";

import { Drum, Waves } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";

export default function RitmoMenuPage() {
  return (
    <SubMenu
      eyebrow="Lectura rítmica"
      title="Elige el módulo"
      intro="Lee la figura, sigue el metrónomo y pulsa en el sitio exacto."
      category="lenguaje"
      options={[
        {
          title: "Módulo 1",
          description: "Pulso y precisión con figuras básicas.",
          href: "/play/ritmo/modulo1",
          Icon: Drum,
          badge: "Inicial",
        },
        {
          title: "Módulo 2",
          description: "Patrones más largos y subdivisiones más finas.",
          href: "/play/ritmo/modulo2",
          Icon: Waves,
          badge: "Avanzado",
        },
      ]}
    />
  );
}
