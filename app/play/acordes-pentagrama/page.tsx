"use client";

import { PencilLine, Search } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";

export default function AcordesPentagramaMenuPage() {
  return (
    <SubMenu
      eyebrow="Acordes en el pentagrama"
      title="Elige en qué dirección"
      intro="El mismo acorde, de las dos maneras: leerlo del papel y escribirlo en el papel. Saber una no es saber la otra."
      category="lenguaje"
      options={[
        {
          title: "Nombra el acorde",
          description: "Salen sus notas escritas y dices qué acorde es.",
          href: "/play/acordes-pentagrama/nombrar",
          Icon: Search,
        },
        {
          title: "Escribe el acorde",
          description: "Sale su nombre y dices qué notas lo forman.",
          href: "/play/acordes-pentagrama/escribir",
          Icon: PencilLine,
        },
      ]}
    />
  );
}
