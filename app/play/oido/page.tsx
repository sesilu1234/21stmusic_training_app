"use client";

import { Headphones, Layers } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import EarIntervalPicker from "./EarIntervalPicker";
import { useStoredEarSet } from "./useStoredEarSet";
import { FULL_EAR_SET, earSetQuery } from "@/lib/earIntervals";

export default function OidoMenuPage() {
  // Los intervalos se eligen aquí y viajan en el enlace de cada tarjeta, así
  // que al pulsar una se empieza a jugar directamente con ellos.
  const { marked, set, setMarked } = useStoredEarSet();
  // Si lo marcado no llega al mínimo, las tarjetas llevan a jugar con todos
  // (el selector lo avisa).
  const query = earSetQuery(set ?? FULL_EAR_SET);

  return (
    <SubMenu
      eyebrow="Oído"
      title="Intervalos al oído"
      intro="Dos notas y una pregunta: qué distancia hay entre ellas."
      category="oido"
      beforeOptions={<EarIntervalPicker marked={marked} set={set} onChange={setMarked} />}
      options={[
        {
          title: "Melódicos",
          description: "Las dos notas suenan una detrás de otra. Es por donde se empieza.",
          href: `/play/oido/intervalos${query}`,
          Icon: Headphones,
        },
        {
          title: "Armónicos",
          description: "Las dos notas suenan a la vez. Cuesta más separarlas.",
          href: `/play/oido/armonico${query}`,
          Icon: Layers,
        },
      ]}
    />
  );
}
