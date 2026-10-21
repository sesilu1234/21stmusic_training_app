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

const CLEF_X = 16;
/** X de la alteración de la primera columna. La cabeza va 28 más a la derecha. */
const FIRST_COLUMN_X = 100;
const HEAD_OFFSET = 28;
/** Separación entre columnas cuando hay varias notas seguidas. */
const COLUMN_GAP = 56;
/**
 * Ancho de una cabeza de nota, para desplazar segundas y alargar las líneas
 * adicionales. La redonda es bastante más ancha que la negra.
 */
const HEAD_WIDTH = { black: 13, whole: 19 } as const;
const ACCIDENTAL_SLOT = 15;
const TAIL_X = 62;

export type NoteState = "idle" | "correct" | "wrong" | "hint";

/**
 * Dos tintas. "dark" es la de una partitura de papel, negro sobre blanco, y es
 * la que usan todos los modos (ver `StaffCard`); los colores de acierto y fallo
 * van oscurecidos para que se lean sobre el blanco. "light" es la de antes,
 * blanco sobre fondo oscuro, por si algún sitio la necesita.
 */
type Ink = "light" | "dark";

const INK: Record<Ink, { line: string; clef: string; state: Record<NoteState, string> }> = {
  light: {
    line: "rgba(255,255,255,0.55)",
    clef: "rgba(255,255,255,0.9)",
    state: { idle: "#ffffff", correct: "#34d399", wrong: "#fb7185", hint: "#7dd3fc" },
  },
  dark: {
    line: "#000000",
    clef: "#000000",
    state: { idle: "#000000", correct: "#059669", wrong: "#e11d48", hint: "#0284c7" },
  },
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
  ink = "dark",
  head = "whole",
  padding = 3.5,
  fit = "width",
}: {
  columns: StaffColumn[];
  clef?: Clef;
  className?: string;
  label?: string;
  /** "dark" para la tarjeta blanca (lo normal), "light" para un fondo oscuro. */
  ink?: Ink;
  /** Negras o redondas. Las redondas son las de los ejercicios de papel. */
  head?: "black" | "whole";
  /**
   * Margen arriba y abajo, en espacios. Con 3.5 caben dos líneas adicionales
   * con su alteración; si las notas no se salen tanto, menos margen deja el
   * pentagrama más grande en la misma caja.
   */
  padding?: number;
  /** Qué manda en el tamaño: el ancho de la caja (lo normal) o su alto. */
  fit?: "width" | "height";
}) {
  const colors = INK[ink];
  const headWidth = HEAD_WIDTH[head];
  const headGlyph = head === "whole" ? GLYPH.noteheadWhole : GLYPH.noteheadBlack;

  const padY = SPACE * padding;
  const height = STAFF_HEIGHT + padY * 2;
  /** Y de la línea inferior del pentagrama. */
  const bottomY = padY + STAFF_HEIGHT;
  const bottom = bottomLineDegree(clef);

  /** Y de un grado diatónico: cada grado sube medio espacio. */
  const degreeY = (value: number) => bottomY - (value - bottom) * (SPACE / 2);

  const columnX = (index: number) => FIRST_COLUMN_X + index * COLUMN_GAP;
  const width = columnX(Math.max(0, columns.length - 1)) + HEAD_OFFSET + TAIL_X;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`${fit === "width" ? "w-full" : "h-full"} ${className}`}
      role="img"
      aria-label={label}
    >
      {/* Las cinco líneas. */}
      {[0, 1, 2, 3, 4].map((line) => (
        <line
          key={line}
          x1={4}
          x2={width - 4}
          y1={padY + line * SPACE}
          y2={padY + line * SPACE}
          stroke={colors.line}
          strokeWidth={1.3}
        />
      ))}

      <text
        x={CLEF_X}
        y={degreeY(clefAnchorDegree(clef))}
        fontFamily="Bravura"
        fontSize={SPACE * 4}
        fill={colors.clef}
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
                x1={headX - headWidth}
                x2={headX + headWidth + offset * headWidth}
                y1={degreeY(value)}
                y2={degreeY(value)}
                stroke={colors.line}
                strokeWidth={1.3}
              />
            ))}

            {sorted.map((note, noteIndex) => {
              const y = degreeY(note.degree);
              const color = colors.state[note.state ?? "idle"];

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
                    x={headX + offsets[noteIndex] * headWidth}
                    y={y}
                    fontFamily="Bravura"
                    fontSize={SPACE * 4}
                    fill={color}
                    textAnchor="middle"
                  >
                    {headGlyph}
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
