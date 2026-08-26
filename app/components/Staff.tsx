"use client";

import {
  GLYPH,
  accidentalGlyph,
  bottomLineDegree,
  clefAnchorDegree,
  ledgerDegrees,
  type Accidental,
  type Clef,
} from "@/lib/staff";

/**
 * Un pentagrama con las notas que le eches: sueltas, apiladas en acordes o una
 * detrás de otra. Dibujado en SVG con los glifos de Bravura, que es la fuente
 * que ya trae la app para el módulo de ritmo.
 *
 * SMuFL dibuja sus glifos sobre un pentagrama de 1 em = 4 espacios, así que
 * poniendo el tamaño de letra a 4 × el espacio entre líneas todo cae solo en
 * su sitio: solo hay que colocar cada glifo en la línea que le toca.
 *
 * Aquí se trabaja con grados y alteraciones, no con semitonos: en el papel Do#
 * y Reb son dos notas distintas. Para dibujar un semitono suelto está
 * `StaffNote`, que hace la conversión.
 */

/** Espacio entre líneas del pentagrama, en unidades del viewBox. */
const SPACE = 12;
const STAFF_HEIGHT = SPACE * 4;
/** Margen arriba y abajo para las líneas adicionales. */
const PAD_Y = SPACE * 4;
const HEIGHT = STAFF_HEIGHT + PAD_Y * 2;
/** Y de la línea inferior del pentagrama. */
const BOTTOM_Y = PAD_Y + STAFF_HEIGHT;

const CLEF_X = 16;
/** X de la alteración de la primera columna. La cabeza va 28 más a la derecha. */
const FIRST_COLUMN_X = 100;
const HEAD_OFFSET = 28;
/** Separación entre columnas cuando hay varias notas seguidas. */
const COLUMN_GAP = 56;
/** Ancho de una cabeza de nota, para desplazar segundas y apilar alteraciones. */
const HEAD_WIDTH = 13;
const ACCIDENTAL_SLOT = 15;
const TAIL_X = 62;

export type NoteState = "idle" | "correct" | "wrong" | "hint";

const STATE_COLOR: Record<NoteState, string> = {
  idle: "#ffffff",
  correct: "#34d399",
  wrong: "#fb7185",
  hint: "#7dd3fc",
};

export interface StaffGlyph {
  /** Grado diatónico respecto al Do central. */
  degree: number;
  accidental?: Accidental;
  state?: NoteState;
}

/** Un golpe: una nota, o varias sonando a la vez. */
export type StaffColumn = StaffGlyph[];

/**
 * Cuánto se aparta cada cabeza del centro de su columna.
 *
 * Dos notas a distancia de segunda no caben en la misma vertical —se pisarían—,
 * así que la de arriba se dibuja al lado. Es lo que hace cualquier partitura.
 */
const headOffsets = (sorted: StaffGlyph[]) => {
  const offsets: number[] = [];
  sorted.forEach((note, index) => {
    const previous = sorted[index - 1];
    const collides = previous && note.degree - previous.degree === 1;
    offsets.push(collides && offsets[index - 1] === 0 ? 1 : 0);
  });
  return offsets;
};

/**
 * En qué columna va la alteración de cada nota.
 *
 * Van todas a la izquierda de la cabeza; si dos quedan demasiado cerca en
 * vertical, la siguiente se retira una columna más para que no se toquen.
 */
const accidentalSlots = (sorted: StaffGlyph[]) => {
  const slots = new Array<number>(sorted.length).fill(0);
  const placed: { degree: number; slot: number }[] = [];

  // De arriba abajo, que es el orden en que se colocan a mano.
  for (let index = sorted.length - 1; index >= 0; index--) {
    if (!sorted[index].accidental) continue;

    let slot = 0;
    while (
      placed.some(
        (other) => other.slot === slot && Math.abs(other.degree - sorted[index].degree) < 6,
      )
    ) {
      slot++;
    }

    slots[index] = slot;
    placed.push({ degree: sorted[index].degree, slot });
  }

  return slots;
};

export default function Staff({
  columns,
  clef = "sol",
  className = "",
  label = "Notas en el pentagrama",
}: {
  columns: StaffColumn[];
  clef?: Clef;
  className?: string;
  label?: string;
}) {
  const bottom = bottomLineDegree(clef);

  /** Y de un grado diatónico: cada grado sube medio espacio. */
  const degreeY = (value: number) => BOTTOM_Y - (value - bottom) * (SPACE / 2);

  const columnX = (index: number) => FIRST_COLUMN_X + index * COLUMN_GAP;
  const width = columnX(Math.max(0, columns.length - 1)) + HEAD_OFFSET + TAIL_X;

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      className={`w-full ${className}`}
      role="img"
      aria-label={label}
    >
      {/* Las cinco líneas. */}
      {[0, 1, 2, 3, 4].map((line) => (
        <line
          key={line}
          x1={4}
          x2={width - 4}
          y1={PAD_Y + line * SPACE}
          y2={PAD_Y + line * SPACE}
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

      {columns.map((column, index) => {
        const sorted = [...column].sort((a, b) => a.degree - b.degree);
        const offsets = headOffsets(sorted);
        const slots = accidentalSlots(sorted);

        const accidentalX = columnX(index);
        const headX = accidentalX + HEAD_OFFSET;

        // Una sola línea adicional aunque dos notas la compartan, y ancha como
        // el conjunto: si hay una segunda, la línea tiene que llegar a las dos.
        const ledgers = new Map<number, number>();
        sorted.forEach((note, noteIndex) => {
          ledgerDegrees(clef, note.degree).forEach((value) => {
            ledgers.set(value, Math.max(ledgers.get(value) ?? 0, offsets[noteIndex]));
          });
        });

        return (
          <g key={index}>
            {[...ledgers].map(([value, offset]) => (
              <line
                key={value}
                x1={headX - HEAD_WIDTH}
                x2={headX + HEAD_WIDTH + offset * HEAD_WIDTH}
                y1={degreeY(value)}
                y2={degreeY(value)}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={1.3}
              />
            ))}

            {sorted.map((note, noteIndex) => {
              const y = degreeY(note.degree);
              const color = STATE_COLOR[note.state ?? "idle"];

              return (
                <g key={`${note.degree}-${noteIndex}`}>
                  {note.accidental && (
                    <text
                      x={accidentalX - slots[noteIndex] * ACCIDENTAL_SLOT}
                      y={y}
                      fontFamily="Bravura"
                      fontSize={SPACE * 4}
                      fill={color}
                    >
                      {accidentalGlyph(note.accidental)}
                    </text>
                  )}

                  <text
                    x={headX + offsets[noteIndex] * HEAD_WIDTH}
                    y={y}
                    fontFamily="Bravura"
                    fontSize={SPACE * 4}
                    fill={color}
                    textAnchor="middle"
                  >
                    {GLYPH.noteheadBlack}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
