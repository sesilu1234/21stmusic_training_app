"use client";

import Staff, { type NoteState } from "./Staff";
import { staffPosition, type Clef } from "@/lib/staff";

/**
 * Un pentagrama con una nota suelta, escrita a partir de su semitono.
 *
 * Es un atajo sobre `Staff`, que es quien dibuja de verdad: aquí solo se decide
 * cómo se deletrea el semitono —Do# o Reb— antes de pasárselo.
 */
export default function StaffNote({
  semitone,
  clef = "sol",
  preferFlat = false,
  state = "idle",
  className = "",
}: {
  /** Semitono absoluto, 0 = Do central. */
  semitone: number;
  clef?: Clef;
  /** true escribe las teclas negras como bemol (Reb) en vez de sostenido (Do#). */
  preferFlat?: boolean;
  state?: NoteState;
  className?: string;
}) {
  const { degree, accidental } = staffPosition(semitone, preferFlat);

  return (
    <Staff
      clef={clef}
      className={className}
      label="Nota en el pentagrama"
      columns={[[{ degree, accidental, state }]]}
    />
  );
}

export type { NoteState };
