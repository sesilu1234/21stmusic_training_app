// Cómo se coloca una nota en el pentagrama.
//
// Un semitono no basta para dibujar: Do# y Reb suenan igual pero se escriben en
// alturas distintas del pentagrama. Aquí se pasa de semitono a "grado
// diatónico + alteración", que es lo que de verdad determina la posición.
//
// El grado diatónico cuenta las notas naturales seguidas desde el Do central:
// Do4 = 0, Re4 = 1, … Si4 = 6, Do5 = 7. Sube de uno en uno aunque el salto en
// semitonos sea distinto, que es exactamente como funciona el pentagrama.

export type Clef = "sol" | "fa";
export type Accidental = "sharp" | "flat" | "natural" | null;

/** Semitono de cada grado dentro de la octava. */
const DEGREE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/** Cómo se llama cada grado dentro de la octava. */
export const DEGREE_NAMES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"] as const;

/** El grado, ya reducido a la octava: sirve para nombrar y para el semitono. */
export const degreeInOctave = (degree: number) => ((degree % 7) + 7) % 7;

/**
 * Una nota tal y como se escribe: en qué grado del pentagrama va y con qué
 * alteración. Es lo contrario de un semitono suelto — aquí Do# y Reb son dos
 * notas distintas, que es justo lo que hace falta para escribir acordes.
 */
export interface SpelledNote {
  /** Grado diatónico respecto al Do central. */
  degree: number;
  /** -1 bemol, 0 natural, 1 sostenido. */
  alter: number;
}

/** Cómo suena una nota escrita, en semitonos absolutos. */
export const spelledSemitone = ({ degree, alter }: SpelledNote) =>
  Math.floor(degree / 7) * 12 + DEGREE_SEMITONES[degreeInOctave(degree)] + alter;

/** Cómo se llama una nota escrita: "Do", "Mib", "Fa#"… */
export const spelledName = ({ degree, alter }: SpelledNote) =>
  `${DEGREE_NAMES[degreeInOctave(degree)]}${alter === 1 ? "#" : alter === -1 ? "b" : ""}`;

export const alterAccidental = (alter: number): Accidental =>
  alter === 1 ? "sharp" : alter === -1 ? "flat" : null;

/** Semitono alterado → grado al que se le pone sostenido. */
const SHARP_DEGREE: Record<number, number> = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
/** Semitono alterado → grado al que se le pone bemol. */
const FLAT_DEGREE: Record<number, number> = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 };

export interface StaffPosition {
  /** Grado diatónico respecto al Do central. */
  degree: number;
  accidental: Accidental;
}

/**
 * Dónde se escribe un semitono absoluto. `preferFlat` decide cómo se deletrea
 * una tecla negra: Do# (false) o Reb (true).
 */
export const staffPosition = (semitone: number, preferFlat = false): StaffPosition => {
  const octave = Math.floor(semitone / 12);
  const within = ((semitone % 12) + 12) % 12;

  const natural = DEGREE_SEMITONES.indexOf(within);
  if (natural !== -1) return { degree: octave * 7 + natural, accidental: null };

  // Con bemol la nota se escribe sobre el grado de ARRIBA, que puede caer ya
  // en la octava siguiente (La#/Sib no, pero Si sostenido sí lo haría).
  const degree = preferFlat ? FLAT_DEGREE[within] : SHARP_DEGREE[within];
  return {
    degree: octave * 7 + degree,
    accidental: preferFlat ? "flat" : "sharp",
  };
};

/**
 * Grado diatónico de la línea inferior del pentagrama.
 * Sol: Mi4. Fa: Sol2.
 */
export const bottomLineDegree = (clef: Clef) => (clef === "sol" ? 2 : -10);

/** Grado sobre el que se apoya el dibujo de la clave. Sol: Sol4. Fa: Fa3. */
export const clefAnchorDegree = (clef: Clef) => (clef === "sol" ? 4 : -4);

/**
 * Líneas adicionales que hace falta pintar para un grado que se sale del
 * pentagrama. Solo caen en grados de la misma paridad que las líneas.
 */
export const ledgerDegrees = (clef: Clef, degree: number): number[] => {
  const bottom = bottomLineDegree(clef);
  const top = bottom + 8;
  const lines: number[] = [];

  // Por debajo: de la primera línea adicional hacia abajo, de dos en dos.
  for (let d = bottom - 2; d >= degree; d -= 2) lines.push(d);
  // Por encima: igual pero hacia arriba.
  for (let d = top + 2; d <= degree; d += 2) lines.push(d);

  return lines;
};

/**
 * Rango cómodo de cada clave: lo que se lee sin pasar de dos líneas
 * adicionales. En semitonos absolutos, con 0 = Do central.
 */
export const CLEF_RANGE: Record<Clef, { from: number; to: number }> = {
  // De La3 (una línea adicional abajo) a La5.
  sol: { from: -3, to: 21 },
  // De La1 a La3, dos octavas por debajo.
  fa: { from: -27, to: -3 },
};

/**
 * Glifos SMuFL de Bravura que usa el pentagrama. Van escapados porque son
 * caracteres de uso privado: pegados tal cual, cualquier editor que reguarde
 * el archivo con otra codificación se los carga.
 */
export const GLYPH = {
  gClef: "\uE050",
  fClef: "\uE062",
  noteheadBlack: "\uE0A4",
  sharp: "\uE262",
  flat: "\uE260",
  natural: "\uE261",
} as const;

export const accidentalGlyph = (accidental: Accidental) =>
  accidental === "sharp"
    ? GLYPH.sharp
    : accidental === "flat"
      ? GLYPH.flat
      : accidental === "natural"
        ? GLYPH.natural
        : null;
