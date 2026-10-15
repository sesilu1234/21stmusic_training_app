"use client";

import { Headphones, Layers } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import EarLevelSelect from "./EarLevelSelect";
import { useStoredEarLevel } from "./useStoredEarLevel";

export default function OidoMenuPage() {
  // El nivel se elige aquí y viaja en el enlace de cada tarjeta, así que al
  // pulsar una se empieza a jugar directamente en ese nivel.
  const [level, setLevel] = useStoredEarLevel();

  return (
    <SubMenu
      eyebrow="Oído"
      title="Intervalos al oído"
      intro="Dos notas y una pregunta: qué distancia hay entre ellas."
      category="oido"
      beforeOptions={<EarLevelSelect value={level} onChange={setLevel} />}
      options={[
        {
          title: "Melódicos",
          description: "Las dos notas suenan una detrás de otra. Es por donde se empieza.",
          href: `/play/oido/intervalos?nivel=${level.id}`,
          Icon: Headphones,
        },
        {
          title: "Armónicos",
          description: "Las dos notas suenan a la vez. Cuesta más separarlas.",
          href: `/play/oido/armonico?nivel=${level.id}`,
          Icon: Layers,
        },
      ]}
    />
  );
}
