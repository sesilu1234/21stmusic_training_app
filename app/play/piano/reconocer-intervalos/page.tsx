"use client";

import { Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import PianoIntervalPicker from "./PianoIntervalPicker";
import { useStoredPianoIntervals } from "./useStoredPianoIntervals";
import { ALL_PIANO_SEMITONES, ALL_INTERVALS_LEVEL, pianoIntervalQuery } from "@/lib/pianoIntervals";

export default function PianoReconocerMenuPage() {
  // Los intervalos se eligen aquí y viajan en el enlace de la tarjeta. Si lo
  // marcado no llega al mínimo, se juega con todos (el selector lo avisa).
  const { marked, selection, setMarked } = useStoredPianoIntervals("21st_piano_reconocer_marcados");
  const query = pianoIntervalQuery(selection ?? { semitones: ALL_PIANO_SEMITONES, custom: false });
  const custom = selection?.custom ?? false;

  return (
    <SubMenu
      eyebrow="Piano"
      title="Reconoce el intervalo"
      intro="Se encienden dos teclas del piano y tú dices qué distancia hay entre ellas. Es el modo de al lado dado la vuelta: aquí no buscas la tecla, la miras y la mides."
      category="piano"
      layout="accordion"
      groups={[
        { id: "jugar", title: "Intervalos", description: "Elige arriba cuáles. Con todos marcados cuenta para la medalla." },
      ]}
      beforeOptions={<PianoIntervalPicker marked={marked} selection={selection} onChange={setMarked} />}
      options={[
        {
          title: custom ? "Practicar los marcados" : ALL_INTERVALS_LEVEL.title,
          description: custom
            ? "Solo salen los intervalos que has elegido, desde cualquier tecla."
            : ALL_INTERVALS_LEVEL.desc,
          href: `/play/piano/reconocer-intervalos/${ALL_INTERVALS_LEVEL.slug}${query}`,
          Icon: Sparkles,
          group: "jugar",
        },
      ]}
    />
  );
}
