// Modos griegos al oído.
//
// Un solo nivel y con los siete modos dentro: partirlo en "los brillantes" y
// "los oscuros" sería enseñar la respuesta a medias, porque media pista es
// saber ya de qué mitad viene.
//
// La escala suena SIEMPRE sobre un pedal de la fundamental. Sin él esto sería
// un juego de memoria —jónico y lidio se diferencian en una nota que pasa
// volando—; con él cada modo tiene un color que se reconoce de golpe, que es
// como se aprenden de verdad.

export interface EarMode {
  id: string;
  label: string;
  /** Una octava del modo, subiendo, desde la fundamental. */
  intervals: number[];
}

export const EAR_MODES: EarMode[] = [
  { id: "jonico", label: "Jónico", intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
  { id: "dorico", label: "Dórico", intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
  { id: "frigio", label: "Frigio", intervals: [0, 1, 3, 5, 7, 8, 10, 12] },
  { id: "lidio", label: "Lidio", intervals: [0, 2, 4, 6, 7, 9, 11, 12] },
  { id: "mixolidio", label: "Mixolidio", intervals: [0, 2, 4, 5, 7, 9, 10, 12] },
  { id: "eolico", label: "Eólico", intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
  { id: "locrio", label: "Locrio", intervals: [0, 1, 3, 5, 6, 8, 10, 12] },
];

export const findMode = (id: string) => EAR_MODES.find((mode) => mode.id === id)!;

export interface ModeQuestion {
  modeId: string;
  /** Fundamental de la escala, en semitonos (0 = Do central). */
  root: number;
}

/** Las notas de la escala, en semitonos absolutos. */
export const modeNotes = (question: ModeQuestion) =>
  findMode(question.modeId).intervals.map((s) => question.root + s);

/**
 * La escala subiendo y volviendo a bajar, sin repetir la nota de arriba.
 *
 * No es lo que suena por defecto —son casi siete segundos y en una ronda de
 * 24 se hace larguísimo— pero de vuelta se oyen cosas que subiendo se pasan:
 * la b6 del eólico o la b2 del frigio cantan mucho más al bajar.
 */
export const modeNotesRoundTrip = (question: ModeQuestion) => {
  const up = modeNotes(question);
  return [...up, ...up.slice(0, -1).reverse()];
};

/** El pedal va una octava por debajo de la fundamental, para no estorbar. */
export const droneNote = (question: ModeQuestion) => question.root - 12;

/**
 * Fundamental al azar en una octava baja: se transporta cada pregunta para que
 * el modo se reconozca por su color y no por las notas que salen.
 */
const randomRoot = () => Math.floor(Math.random() * 8) - 2;

/** Preguntas de una ronda, sin repetir modo dos veces seguidas. */
export const buildModeQuiz = (count: number): ModeQuestion[] => {
  const questions: ModeQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const previous = questions[i - 1]?.modeId;
    const pool = EAR_MODES.filter((mode) => mode.id !== previous);
    const mode = pool[Math.floor(Math.random() * pool.length)];
    questions.push({ modeId: mode.id, root: randomRoot() });
  }

  return questions;
};
