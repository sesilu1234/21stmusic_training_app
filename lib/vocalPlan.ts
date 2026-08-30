/**
 * El motor que comparten Vocalizaciones y los ejercicios de Rockschool.
 *
 * Los dos modos hacen lo mismo por dentro: un patrón corto de notas que se
 * repite a distintas alturas mientras el alumno canta. Lo único que cambia es
 * de dónde sale el patrón — inventado en un caso, sacado del método en el otro.
 *
 * Todo el ejercicio se calcula de golpe antes de empezar en vez de ir
 * decidiendo sobre la marcha: así el resaltado del teclado y el audio salen
 * del mismo sitio y no se pueden desincronizar.
 *
 * Los semitonos son los mismos de siempre en la app: 0 = Do central.
 */

// --- Recorrido ---------------------------------------------------------

/**
 * Las alturas por las que va pasando el ejercicio: se sube de semitono en
 * semitono hasta el techo y se vuelve a bajar pasándose de largo por abajo,
 * que es como se calienta de toda la vida — se acaba en la zona cómoda, no
 * en lo más agudo.
 */
export const buildRoots = (start: number, up: number, down: number) => {
  const roots: number[] = [];
  for (let step = 0; step <= up; step += 1) roots.push(start + step);
  for (let step = up - 1; step >= -down; step -= 1) roots.push(start + step);
  return roots;
};

// --- Modos de acompañamiento -------------------------------------------

/**
 * Cuánto toca el piano:
 *  - `guia`    el patrón entero en cada repetición; se canta encima.
 *  - `muestra` el patrón entero una sola vez y después solo la primera nota:
 *              enseña el ejercicio y luego te suelta.
 *  - `bajo`    solo la primera nota, siempre. Cantas tú, el piano solo te da
 *              por dónde entrar.
 *
 * En los dos últimos, esa nota que da el piano NO es un aviso previo: es el
 * primer tiempo del ejercicio, la nota por la que empiezas a cantar. Antes
 * sonaba la tónica un pulso antes y liaba, porque te quedabas esperando sin
 * saber si el ejercicio había empezado ya.
 */
export type AccompanimentMode = "guia" | "muestra" | "bajo";

export interface AccompanimentOption {
  id: AccompanimentMode;
  label: string;
  hint: string;
}

export const ACCOMPANIMENTS: AccompanimentOption[] = [
  {
    id: "guia",
    label: "Piano guía",
    hint: "El piano toca el ejercicio entero cada vez.",
  },
  {
    id: "muestra",
    label: "Muestra y suelta",
    hint: "Lo toca una vez y después solo te da la nota por la que entras.",
  },
  {
    id: "bajo",
    label: "Solo el bajo",
    hint: "Solo la primera nota de cada vuelta. El resto lo cantas tú.",
  },
];

// --- El plan -----------------------------------------------------------

/**
 * Un momento del ejercicio: qué nota es, si suena o solo se ilumina, y a qué
 * milisegundo del principio le toca.
 */
export interface VocalEvent {
  at: number;
  /** Índice de la repetición dentro del recorrido. */
  repetition: number;
  /** Altura de partida de esa repetición, en semitonos absolutos. */
  root: number;
  /** Índice de la nota dentro del patrón, o -1 si es el golpe de tónica. */
  step: number;
  /** Nota, en semitonos absolutos. */
  semitone: number;
  /** false = solo se ilumina, la canta el alumno. */
  audible: boolean;
  /** true si es la nota que da el piano para que entres: la primera de la vuelta. */
  cue: boolean;
}

/** Un golpe de metrónomo. `accent` cae en el primer pulso de cada vuelta. */
export interface Tick {
  at: number;
  accent: boolean;
}

export interface Plan {
  events: VocalEvent[];
  /** El pulso, para el metrónomo. Va aparte porque suena aunque no haya nota. */
  ticks: Tick[];
  /** Cuánto dura todo, en milisegundos. */
  duration: number;
  roots: number[];
  /** Nota más grave y más aguda de todo el recorrido. */
  lowest: number;
  highest: number;
}

export interface PlanOptions {
  /** El patrón, en semitonos desde su nota de partida. */
  pattern: number[];
  /** Alturas por las que pasa, en semitonos absolutos. */
  roots: number[];
  bpm: number;
  mode: AccompanimentMode;
  /** Pulsos que dura cada nota. */
  noteBeats?: number;
  /** Lo que se deja sonar la última nota de cada vuelta. */
  lastBeats?: number;
  /** Silencio entre una vuelta y la siguiente. */
  gapBeats?: number;
}

export const buildPlan = ({
  pattern,
  roots,
  bpm,
  mode,
  noteBeats = 1,
  lastBeats = 2,
  gapBeats = 2,
}: PlanOptions): Plan => {
  const beat = 60000 / bpm;
  const events: VocalEvent[] = [];
  const ticks: Tick[] = [];
  let at = 0;

  roots.forEach((root, repetition) => {
    // El primer pulso de la vuelta va acentuado: es la única manera de saber
    // por dónde vas cuando el piano ya no toca.
    const repetitionStart = at;
    // En "muestra" solo se toca de verdad la primera vuelta; en "bajo", nunca.
    const guided = mode === "guia" || (mode === "muestra" && repetition === 0);

    pattern.forEach((offset, step) => {
      // Cuando el piano no guía la vuelta, da la primera nota y calla. Ocupa
      // el primer tiempo del ejercicio, no un pulso de más antes de empezar.
      const lead = !guided && step === 0;

      events.push({
        at,
        repetition,
        root,
        step,
        semitone: root + offset,
        audible: guided || lead,
        cue: lead,
      });
      at += beat * (step === pattern.length - 1 ? lastBeats : noteBeats);
    });

    at += beat * gapBeats;

    // El pulso corre entero, silencios incluidos: si el metrónomo se callara
    // en los huecos habría que volver a cogerlo en cada vuelta.
    for (let time = repetitionStart; time < at - 1; time += beat) {
      ticks.push({ at: time, accent: time === repetitionStart });
    }
  });

  return {
    events,
    ticks,
    duration: at,
    roots,
    lowest: Math.min(...roots) + Math.min(...pattern),
    highest: Math.max(...roots) + Math.max(...pattern),
  };
};

// --- Nombres -----------------------------------------------------------

const NAMES = [
  "Do",
  "Do#",
  "Re",
  "Re#",
  "Mi",
  "Fa",
  "Fa#",
  "Sol",
  "Sol#",
  "La",
  "La#",
  "Si",
];

/**
 * Nombre con octava, contando el Do central como Do4 — que es el convenio con
 * el que vienen escritas las tesituras en cualquier método de canto.
 */
export const fullNoteName = (semitone: number) => {
  const index = ((semitone % 12) + 12) % 12;
  const octave = 4 + Math.floor(semitone / 12);
  return `${NAMES[index]}${octave}`;
};

/** El grado del patrón, para enseñarlo debajo de cada nota ("1", "3", "5"…). */
const DEGREES: Record<number, string> = {
  0: "1",
  1: "♭2",
  2: "2",
  3: "♭3",
  4: "3",
  5: "4",
  6: "♭5",
  7: "5",
  8: "♭6",
  9: "6",
  10: "♭7",
  11: "7",
  12: "8",
  14: "9",
  16: "10",
};

export const degreeLabel = (offset: number) => DEGREES[offset] ?? `${offset}st`;

// --- Lectura de notas --------------------------------------------------

const LETTERS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/**
 * "A3", "C#4", "Bbb4" → semitono absoluto. Escribir los ejercicios así ocupa
 * una línea en vez de veinte y se lee de un vistazo.
 */
export const parseNote = (name: string) => {
  const match = /^([A-G])(#*|b*)(-?\d)$/.exec(name.trim());
  if (!match) throw new Error(`Nota ilegible: ${name}`);
  const [, letter, accidentals, octave] = match;
  const alter = accidentals.startsWith("#") ? accidentals.length : -accidentals.length;
  return LETTERS[letter] + alter + (Number(octave) - 4) * 12;
};

/** Una línea de notas separadas por espacios → semitonos absolutos. */
export const parseNotes = (spec: string) => spec.trim().split(/\s+/).map(parseNote);
