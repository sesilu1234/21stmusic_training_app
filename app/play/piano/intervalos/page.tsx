"use client";

import { Piano } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import PianoIntervalPicker from "../reconocer-intervalos/PianoIntervalPicker";
import { useStoredPianoIntervals } from "../reconocer-intervalos/useStoredPianoIntervals";
import { ALL_PIANO_SEMITONES, ALL_INTERVALS_LEVEL, pianoIntervalQuery } from "@/lib/pianoIntervals";

export default function PianoIntervalosMenuPage() {
  // Los intervalos se eligen aquí y viajan en el enlace de la tarjeta. Si lo
  // marcado no llega al mínimo, se juega con todos (el selector lo avisa).
  const { marked, selection, setMarked } = useStoredPianoIntervals("21st_piano_tocar_marcados");
  const query = pianoIntervalQuery(selection ?? { semitones: ALL_PIANO_SEMITONES, custom: false });
  const custom = selection?.custom ?? false;

  return (
    <SubMenu
      eyebrow="Piano"
      title="Toca el intervalo"
      intro="El enunciado te da una nota de partida y un intervalo: «desde Mi, toca la 5ª justa». Tú buscas la tecla. La de partida sale marcada en ámbar, así que lo único que hay que contar son los semitonos hacia arriba."
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
            ? "Solo te piden los intervalos que has elegido, desde cualquier tecla."
            : ALL_INTERVALS_LEVEL.desc,
          href: `/play/piano/intervalos/${ALL_INTERVALS_LEVEL.slug}${query}`,
          Icon: Piano,
          group: "jugar",
        },
      ]}
    />
  );
}
