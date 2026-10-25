// Qué se puede meter en un examen: todos los modos que puntúan, con sus
// niveles. Lo usan el formulario de crear (navegador) y el generador
// (servidor), así que aquí solo hay listas, nada de base de datos.
//
// La clave de cada modo es su `slug` de lib/games.ts, y la de cada nivel, el
// slug que lleva en la URL del juego. Así un bloque del examen se lee igual
// que una partida: "/play/lectura-notas" + "sol-naturales".

import { CHORD_LEVELS, PROGRESSION_LEVELS } from "../chordEar";
import { PAIR_LEVELS } from "../chordPair";
import { GAMES, type CategoryId } from "../games";
import { MELODY_LEVELS } from "../melodyEar";
import { NOTE_READING_LEVELS } from "../noteReading";
import { ACORDE_NIVELES, ESCALA_NIVELES } from "../noteSpelling";
import { CHORD_BUILD_LEVELS, SCALE_BUILD_LEVELS } from "../pianoBuild";
import { PIANO_INTERVAL_LEVELS } from "../pianoIntervals";
import { PIANO_NOTE_LEVELS } from "../pianoNotes";
import { RHYTHM_LEVELS } from "../rhythm";
import { CHORD_NAME_LEVELS, CHORD_SPELL_LEVELS } from "../staffChords";
import { STAFF_INTERVAL_LEVELS } from "../staffIntervals";
import { TRIVIA_TOPICS } from "../trivia";
import { CLAVE_LEVELS } from "@/app/play/armadura/notes_images";

export interface ExamLevel {
  slug: string;
  title: string;
}

export interface ExamMode {
  slug: string;
  label: string;
  category: CategoryId;
  /** Vacío = el modo es una pantalla sola, sin niveles. */
  levels: ExamLevel[];
}

const titled = (levels: { slug: string; title: string; badge?: string }[], prefix = "") =>
  levels.map((level) => ({
    slug: `${prefix}${level.slug}`,
    title: level.badge ? `${level.badge} · ${level.title}` : level.title,
  }));

const LEVELS: Record<string, ExamLevel[]> = {
  "/play/lectura-notas": titled(NOTE_READING_LEVELS),
  "/play/intervalos": titled(STAFF_INTERVAL_LEVELS),
  "/play/acordes-pentagrama": [
    ...titled(CHORD_NAME_LEVELS, "nombrar/").map((level) => ({
      ...level,
      title: `Nombrar · ${level.title}`,
    })),
    ...titled(CHORD_SPELL_LEVELS, "escribir/").map((level) => ({
      ...level,
      title: `Escribir · ${level.title}`,
    })),
  ],
  "/play/armadura": CLAVE_LEVELS.map((level) => ({
    slug: level.slug,
    title: `${level.badge} · ${level.titulo}`,
  })),
  "/play/construye-intervalos": [],
  "/play/construye-escalas": titled(ESCALA_NIVELES),
  "/play/construye-acordes": titled(ACORDE_NIVELES),
  "/play/modos": [],
  "/play/ritmo": RHYTHM_LEVELS.map((level) => ({
    slug: level.slug,
    title: `${level.title} · ${level.badge}`,
  })),
  "/play/oido": [
    { slug: "intervalos", title: "Melódicos" },
    { slug: "armonico", title: "Armónicos" },
  ],
  "/play/oido/acordes": [...titled(CHORD_LEVELS), ...titled(PAIR_LEVELS)],
  "/play/oido/progresiones": titled(PROGRESSION_LEVELS),
  "/play/oido/modos": [],
  "/play/oido/dictado": titled(MELODY_LEVELS),
  "/play/diapason": [],
  "/play/diapason_intervalos": [],
  "/play/diapason_acordes": [
    { slug: "triadas", title: "Tríadas" },
    { slug: "septimas", title: "Séptimas" },
  ],
  "/play/piano/notas": titled(PIANO_NOTE_LEVELS),
  "/play/piano/intervalos": titled(PIANO_INTERVAL_LEVELS),
  "/play/piano/reconocer-intervalos": titled(PIANO_INTERVAL_LEVELS),
  "/play/piano/acordes": titled(CHORD_BUILD_LEVELS),
  "/play/piano/escalas": titled(SCALE_BUILD_LEVELS),
  "/play/trivia": TRIVIA_TOPICS.map((topic) => ({ slug: topic.slug, title: topic.title })),
};

/** Los modos que se pueden examinar, en el orden del menú de juegos. */
export const EXAM_MODES: ExamMode[] = GAMES.filter(
  (game) => game.scored && !game.comingSoon && LEVELS[game.slug] !== undefined,
).map((game) => ({
  slug: game.slug,
  label: game.label,
  category: game.category,
  levels: LEVELS[game.slug],
}));

export const findExamMode = (slug: string) => EXAM_MODES.find((mode) => mode.slug === slug);

/** Cómo se llama un bloque: "Lectura de notas · Nivel 1 · Clave de sol". */
export const blockLabel = (modeSlug: string, levelSlug: string | null) => {
  const mode = findExamMode(modeSlug);
  if (!mode) return modeSlug;
  const level = mode.levels.find((item) => item.slug === levelSlug);
  return level ? `${mode.label} · ${level.title}` : mode.label;
};

/** Límites del formulario. El servidor los vuelve a comprobar. */
export const EXAM_LIMITS = {
  titleMax: 120,
  blocksMax: 10,
  perBlockMax: 40,
  totalMax: 100,
  /** Segundos por pregunta que se pueden elegir. */
  secondsOptions: [5, 10, 15, 20, 30, 45, 60, 90, 120],
  secondsDefault: 15,
} as const;
