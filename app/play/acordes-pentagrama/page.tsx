"use client";

import { Hash, Layers, Music4, Shuffle, Sparkles } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { CHORD_NAME_LEVELS, CHORD_SPELL_LEVELS } from "@/lib/staffChords";

const nameIcons = [Music4, Sparkles, Layers, Hash, Shuffle];
const spellIcons = [Music4, Sparkles, Layers, Hash];

/**
 * Antes era un menú de dos tarjetas (Nombrar / Escribir) que llevaba a otro
 * menú con los niveles. Ahora las dos direcciones son dos desplegables con sus
 * niveles dentro, en la misma pantalla. Los submenús de /nombrar y /escribir
 * siguen existiendo: es adonde vuelve "Atrás" desde un nivel.
 */
export default function AcordesPentagramaMenuPage() {
  return (
    <SubMenu
      eyebrow="Acordes en el pentagrama"
      title="Elige dirección y nivel"
      intro="El mismo acorde, de las dos maneras: leerlo del papel y escribirlo en el papel. Saber una no es saber la otra."
      category="lenguaje"
      layout="accordion"
      groups={[
        {
          id: "nombrar",
          title: "Nombra el acorde",
          description: "Salen sus notas escritas y dices qué acorde es: primero la fundamental, después la especie.",
        },
        {
          id: "escribir",
          title: "Escribe el acorde",
          description: "Sale su nombre y dices qué notas lo forman. Van apareciendo en el pentagrama según las eliges.",
        },
      ]}
      options={[
        ...CHORD_NAME_LEVELS.map((level, index) => ({
          title: level.title,
          description: level.desc,
          href: `/play/acordes-pentagrama/nombrar/${level.slug}`,
          Icon: nameIcons[index] ?? Layers,
          badge: level.badge,
          group: "nombrar",
        })),
        ...CHORD_SPELL_LEVELS.map((level, index) => ({
          title: level.title,
          description: level.desc,
          href: `/play/acordes-pentagrama/escribir/${level.slug}`,
          Icon: spellIcons[index] ?? Layers,
          badge: level.badge,
          group: "escribir",
        })),
      ]}
    />
  );
}
