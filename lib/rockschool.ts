/**
 * Los ejercicios del método Rockschool, tal cual vienen en el libro.
 *
 * Aquí solo están los datos: cada ejercicio es su línea de notas y la imagen
 * del pentagrama original escaneado. El reloj, el recorrido y los modos de
 * acompañamiento son los mismos que los de Vocalizaciones y viven en
 * `vocalPlan` — estos ejercicios son exactamente eso, patrones que se cantan
 * a distintas alturas, solo que escritos por otros.
 *
 * Las notas se guardan como texto ("A3 C#4 E4") y se leen con `parseNotes`.
 * Ocupa una línea en vez de veinte y se compara de un vistazo con el libro.
 */

import { parseNotes } from "./vocalPlan";

/** Los grados del método, en su orden. */
export const GRADES = [
  "Debut",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
] as const;

export type Grade = (typeof GRADES)[number];

/** De qué va el ejercicio. Solo se usa para la etiqueta de color. */
export type RockschoolKind = "escala" | "arpegio" | "intervalo";

interface RawExercise {
  slug: string;
  name: string;
  grade: Grade;
  kind: RockschoolKind;
  /** Nombre del escaneo en `/public/assets/rockschool`. */
  image: string;
  /** Las notas del libro, separadas por espacios. */
  notes: string;
  /** true en los ejercicios de intervalos, que van a nota larga. */
  slow?: boolean;
}

const RAW: RawExercise[] = [
  {
    slug: "debut-scale",
    name: "Escala mayor",
    grade: "Debut",
    kind: "escala",
    image: "p01_01_Im1.png",
    notes: "A3 B3 C#4 D4 E4 D4 C#4 B3 A3",
  },
  {
    slug: "debut-arpeggio",
    name: "Arpegio mayor",
    grade: "Debut",
    kind: "arpegio",
    image: "p01_02_Im2.png",
    notes: "A3 C#4 E4 C#4 A3",
  },
  {
    slug: "grade1-scale",
    name: "Escala mayor",
    grade: "Grade 1",
    kind: "escala",
    image: "p01_03_Im3.png",
    notes: "A3 B3 C#4 D4 E4 F#4 G#4 A4 G#4 F#4 E4 D4 C#4 B3 A3",
  },
  {
    slug: "grade1-arpeggio-p1",
    name: "Arpegio mayor (patrón 1)",
    grade: "Grade 1",
    kind: "arpegio",
    image: "p01_04_Im4_pattern1.png",
    notes: "A3 C#4 E4 C#4 A3 C#4 E4 C#4 A3",
  },
  {
    slug: "grade1-arpeggio-p2",
    name: "Arpegio mayor (patrón 2)",
    grade: "Grade 1",
    kind: "arpegio",
    image: "p01_04_Im4_pattern2.png",
    notes: "A3 C#4 E4 A4 E4 C#4 A3 C#4 E4 A4 E4 C#4 A3",
  },
  {
    slug: "grade1-major-2nd",
    name: "2ª mayor",
    grade: "Grade 1",
    kind: "intervalo",
    image: "p01_05_Im5_major2.png",
    notes: "F4 G4", slow: true,
  },
  {
    slug: "grade1-major-3rd",
    name: "3ª mayor",
    grade: "Grade 1",
    kind: "intervalo",
    image: "p01_05_Im5_major3.png",
    notes: "F4 A4", slow: true,
  },
  {
    slug: "grade2-natural-minor",
    name: "Escala menor natural",
    grade: "Grade 2",
    kind: "escala",
    image: "p02_01_Im6.png",
    notes: "A3 B3 C4 D4 E4 F4 G4 A4 G4 F4 E4 D4 C4 B3 A3",
  },
  {
    slug: "grade2-arpeggio-p1",
    name: "Arpegio menor (patrón 1)",
    grade: "Grade 2",
    kind: "arpegio",
    image: "p02_02_Im7_pattern1.png",
    notes: "A3 C4 E4 C4 A3 C4 E4 C4 A3",
  },
  {
    slug: "grade2-arpeggio-p2",
    name: "Arpegio menor (patrón 2)",
    grade: "Grade 2",
    kind: "arpegio",
    image: "p02_02_Im7_pattern2.png",
    notes: "A3 C4 E4 A4 E4 C4 A3 C4 E4 A4 E4 C4 A3",
  },
  {
    slug: "grade2-major-3rd",
    name: "3ª mayor",
    grade: "Grade 2",
    kind: "intervalo",
    image: "p02_03_Im8_major3.png",
    notes: "F4 A4", slow: true,
  },
  {
    slug: "grade2-minor-3rd",
    name: "3ª menor",
    grade: "Grade 2",
    kind: "intervalo",
    image: "p02_03_Im8_minor3.png",
    notes: "F4 Ab4", slow: true,
  },
  {
    slug: "grade3-major-scale",
    name: "Escala mayor",
    grade: "Grade 3",
    kind: "escala",
    image: "p02_04_Im9_major_scale.png",
    notes: "A3 B3 C#4 D4 E4 F#4 G#4 A4 G#4 F#4 E4 D4 C#4 B3 A3",
  },
  {
    slug: "grade3-minor-scale",
    name: "Escala menor natural",
    grade: "Grade 3",
    kind: "escala",
    image: "p02_04_Im9_natural_minor.png",
    notes: "A3 B3 C4 D4 E4 F4 G4 A4 G4 F4 E4 D4 C4 B3 A3",
  },
  {
    slug: "grade3-major-arpeggio",
    name: "Arpegio mayor",
    grade: "Grade 3",
    kind: "arpegio",
    image: "p03_01_Im10_major_arpeggio.png",
    notes: "A3 E4 C#4 A4 E4 C#4 A3 E4 C#4 A4 E4 C#4 A3",
  },
  {
    slug: "grade3-minor-arpeggio",
    name: "Arpegio menor",
    grade: "Grade 3",
    kind: "arpegio",
    image: "p03_01_Im10_minor_arpeggio.png",
    notes: "A3 E4 C4 A4 E4 C4 A3 E4 C4 A4 E4 C4 A3",
  },
  {
    slug: "grade3-perfect-4th",
    name: "4ª justa",
    grade: "Grade 3",
    kind: "intervalo",
    image: "p03_02_Im11_perfect4.png",
    notes: "F4 Bb4", slow: true,
  },
  {
    slug: "grade3-perfect-5th",
    name: "5ª justa",
    grade: "Grade 3",
    kind: "intervalo",
    image: "p03_02_Im11_perfect5.png",
    notes: "F4 C5", slow: true,
  },
  {
    slug: "grade4-pentatonic",
    name: "Pentatónica mayor",
    grade: "Grade 4",
    kind: "escala",
    image: "p03_03_Im12.png",
    notes: "A3 B3 C#4 E4 F#4 A4 F#4 E4 C#4 B3 A3",
  },
  {
    slug: "grade4-pent-arpeggio-p1",
    name: "Arpegio mayor (patrón 1)",
    grade: "Grade 4",
    kind: "arpegio",
    image: "p03_04_Im13_pattern1.png",
    notes: "A3 C#4 E4 A4 C#5 A4 E4 C#4 A3 C#4 E4 A4 C#5 A4 E4 C#4 A3",
  },
  {
    slug: "grade4-pent-arpeggio-p2",
    name: "Arpegios de La mayor y Mi7",
    grade: "Grade 4",
    kind: "arpegio",
    image: "p03_04_Im13_pattern2.png",
    notes: "A3 C#4 E4 A4 G#4 E4 A3 C#4 E4 A4 G#4 E4 A3",
  },
  {
    slug: "grade4-major-6th",
    name: "6ª mayor",
    grade: "Grade 4",
    kind: "intervalo",
    image: "p04_01_Im14_major6.png",
    notes: "F4 D5", slow: true,
  },
  {
    slug: "grade4-major-7th",
    name: "7ª mayor",
    grade: "Grade 4",
    kind: "intervalo",
    image: "p04_01_Im14_major7.png",
    notes: "F4 E5", slow: true,
  },
  {
    slug: "grade5-minor-pent",
    name: "Pentatónica menor",
    grade: "Grade 5",
    kind: "escala",
    image: "p04_02_Im15.png",
    notes: "A3 C4 D4 E4 G4 A4 G4 E4 D4 C4 A3",
  },
  {
    slug: "grade5-major-dominant-arpeggio",
    name: "Arpegios de I mayor y V7",
    grade: "Grade 5",
    kind: "arpegio",
    image: "p04_03_Im16.png",
    notes: "A3 C#4 E4 A4 C#5 E5 D5 B4 G#4 E4 D4 B3 A3 C#4 E4 A4 C#5 E5 D5 B4 G#4 E4 D4 B3 A3",
  },
  {
    slug: "grade5-minor-6th",
    name: "6ª menor",
    grade: "Grade 5",
    kind: "intervalo",
    image: "p04_04_Im17_minor6.png",
    notes: "F4 Db5", slow: true,
  },
  {
    slug: "grade5-minor-7th",
    name: "7ª menor",
    grade: "Grade 5",
    kind: "intervalo",
    image: "p04_04_Im17_minor7.png",
    notes: "F4 Eb5", slow: true,
  },
  {
    slug: "grade6-blues",
    name: "Escala de blues",
    grade: "Grade 6",
    kind: "escala",
    image: "p05_01_Im18.png",
    notes: "A3 C4 D4 D#4 E4 G4 A4 G4 E4 D#4 D4 C4 A3",
  },
  {
    slug: "grade6-c-major-diminished-arpeggio",
    name: "Arpegios de Do mayor y Do dism.",
    grade: "Grade 6",
    kind: "arpegio",
    image: "p05_02_Im19.png",
    notes: "C4 E4 G4 E4 C4 Eb4 Gb4 E4 C4 E4 G4 E4 C4",
  },
  {
    slug: "grade6-major-7th-6th",
    name: "7ª mayor y 6ª mayor",
    grade: "Grade 6",
    kind: "intervalo",
    image: "p05_03_Im20_major7_major6.png",
    notes: "F4 E5 F4 D5 F4", slow: true,
  },
  {
    slug: "grade6-minor-7th-6th",
    name: "7ª menor y 6ª menor",
    grade: "Grade 6",
    kind: "intervalo",
    image: "p05_03_Im20_major7_minor7_octave.png",
    notes: "F4 Eb5 F4 Db5 F4", slow: true,
  },
  {
    slug: "grade7-harmonic-minor",
    name: "Escala menor armónica",
    grade: "Grade 7",
    kind: "escala",
    image: "p05_04_Im21.png",
    notes: "A3 B3 C4 D4 E4 F4 G#4 A4 G#4 F4 E4 D4 C4 B3 A3",
  },
  {
    slug: "grade7-caug",
    name: "Arpegio de Do aumentado",
    grade: "Grade 7",
    kind: "arpegio",
    image: "p05_05_Im22.png",
    notes: "C4 E4 G#4 C5 G#4 E4 C4 E4 G#4 C5 G#4 E4 C4",
  },
  {
    slug: "grade7-major-3rd-2nd",
    name: "3ª mayor y 2ª mayor",
    grade: "Grade 7",
    kind: "intervalo",
    image: "p06_01_Im23_major3_minor3.png",
    notes: "F4 A4 F4 G4 F4",
  },
  {
    slug: "grade7-minor-3rd-2nd",
    name: "3ª menor y 2ª menor",
    grade: "Grade 7",
    kind: "intervalo",
    image: "p06_01_Im23_aminor_arpeggio_p1.png",
    notes: "F4 Ab4 F4 Gb4 F4",
  },
  {
    slug: "grade8-chromatic",
    name: "Escala cromática",
    grade: "Grade 8",
    kind: "escala",
    image: "p06_02_Im24.png",
    notes: "A3 A#3 B3 C4 C#4 D4 D#4 E4 F4 F#4 G4 G#4 A4 G#4 G4 F#4 F4 E4 D#4 D4 C#4 C4 B3 A#3 A3",
  },
  {
    slug: "grade8-diminished",
    name: "Arpegio de 7ª disminuida",
    grade: "Grade 8",
    kind: "arpegio",
    image: "p06_03_Im25.png",
    notes: "C4 Eb4 Gb4 Bbb4 C5 Bbb4 Gb4 Eb4 C4 Eb4 Gb4 Bbb4 C5 Bbb4 Gb4 Eb4 C4",
  },
  {
    slug: "grade8-major-minor-7th-octave",
    name: "7ª mayor, 7ª menor y octava",
    grade: "Grade 8",
    kind: "intervalo",
    image: "p06_04_Im26_major7_minor7_octave.png",
    notes: "F4 E5 F4 Eb5 F4 F5 F4",
  },
  {
    slug: "grade8-major-minor-3rd",
    name: "3ª mayor y 3ª menor",
    grade: "Grade 8",
    kind: "intervalo",
    image: "p06_04_Im26_major3_minor3.png",
    notes: "F4 A4 F4 Ab4 F4",
  },
];

export interface RockschoolExercise extends Omit<RawExercise, "notes"> {
  /** La nota de partida del ejercicio, en semitonos absolutos. */
  base: number;
  /** El resto del ejercicio, en semitonos desde esa nota de partida. */
  pattern: number[];
  /** Cuántos pulsos dura cada nota. */
  noteBeats: number;
}

/**
 * El patrón se guarda relativo a su primera nota — que en todos estos
 * ejercicios es la tónica — para poder transportarlo sin tocar los datos.
 */
export const ROCKSCHOOL_EXERCISES: RockschoolExercise[] = RAW.map((raw) => {
  const notes = parseNotes(raw.notes);
  const base = notes[0];
  return {
    ...raw,
    base,
    pattern: notes.map((note) => note - base),
    noteBeats: raw.slow ? 2 : 1,
  };
});

export const exercisesOfGrade = (grade: Grade) =>
  ROCKSCHOOL_EXERCISES.filter((exercise) => exercise.grade === grade);

export const findRockschoolExercise = (slug: string) =>
  ROCKSCHOOL_EXERCISES.find((exercise) => exercise.slug === slug) ??
  ROCKSCHOOL_EXERCISES[0];
