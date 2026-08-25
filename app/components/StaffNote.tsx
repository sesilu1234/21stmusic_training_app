"use client";

import {
  GLYPH,
  accidentalGlyph,
  bottomLineDegree,
  clefAnchorDegree,
  ledgerDegrees,
  staffPosition,
  type Clef,
} from "@/lib/staff";

/**
 * Un pentagrama con una nota. Dibujado en SVG con los glifos de Bravura, que
 * es la fuente que ya trae la app para el módulo de ritmo.
 *
 * SMuFL dibuja sus glifos sobre un pentagrama de 1 em = 4 espacios, así que
 * poniendo el tamaño de letra a 4 × el espacio entre líneas todo cae solo en
 * su sitio: solo hay que colocar cada glifo en la línea que le toca.
 */

/** Espacio entre líneas del pentagrama, en unidades del viewBox. */
const SPACE = 12;
const STAFF_HEIGHT = SPACE * 4;
/** Margen arriba y abajo para las líneas adicionales. */
const PAD_Y = SPACE * 4;
const WIDTH = 190;
const HEIGHT = STAFF_HEIGHT + PAD_Y * 2;
/** Y de la línea inferior del pentagrama. */
const BOTTOM_Y = PAD_Y + STAFF_HEIGHT;

const NOTE_X = 128;
const ACCIDENTAL_X = 100;
const CLEF_X = 16;

export type NoteState = "idle" | "correct" | "wrong";

const STATE_COLOR: Record<NoteState, string> = {
  idle: "#ffffff",
  correct: "#34d399",
  wrong: "#fb7185",
};

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
  const bottom = bottomLineDegree(clef);

  /** Y de un grado diatónico: cada grado sube medio espacio. */
  const degreeY = (value: number) => BOTTOM_Y - (value - bottom) * (SPACE / 2);

  const noteY = degreeY(degree);
  const ledgers = ledgerDegrees(clef, degree);
  const color = STATE_COLOR[state];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`w-full ${className}`}
      role="img"
      aria-label="Nota en el pentagrama"
    >
      {/* Las cinco líneas. */}
      {[0, 1, 2, 3, 4].map((line) => (
        <line
          key={line}
          x1={4}
          x2={WIDTH - 4}
          y1={PAD_Y + line * SPACE}
          y2={PAD_Y + line * SPACE}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.3}
        />
      ))}

      {/* Líneas adicionales: solo bajo la nota, y algo más anchas que ella. */}
      {ledgers.map((value) => (
        <line
          key={value}
          x1={NOTE_X - 13}
          x2={NOTE_X + 13}
          y1={degreeY(value)}
          y2={degreeY(value)}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.3}
        />
      ))}

      <text
        x={CLEF_X}
        y={degreeY(clefAnchorDegree(clef))}
        fontFamily="Bravura"
        fontSize={SPACE * 4}
        fill="rgba(255,255,255,0.9)"
      >
        {clef === "sol" ? GLYPH.gClef : GLYPH.fClef}
      </text>

      {accidental && (
        <text
          x={ACCIDENTAL_X}
          y={noteY}
          fontFamily="Bravura"
          fontSize={SPACE * 4}
          fill={color}
        >
          {accidentalGlyph(accidental)}
        </text>
      )}

      <text
        x={NOTE_X}
        y={noteY}
        fontFamily="Bravura"
        fontSize={SPACE * 4}
        fill={color}
        textAnchor="middle"
      >
        {GLYPH.noteheadBlack}
      </text>
    </svg>
  );
}
