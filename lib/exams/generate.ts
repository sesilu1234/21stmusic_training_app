// Las preguntas de un examen, sacadas de los mismos generadores que los modos.
//
// Cada modo tiene aquí su adaptador: llama al generador del juego (con el
// azar del examen en vez de Math.random, ver `withSeededRandom`) y lo traduce
// a una `ExamQuestion`: qué se enseña, cómo se contesta y cuál es la buena.
// Así una pregunta de examen es exactamente una pregunta del juego.
//
// Dos cosas cambian respecto al juego, y las dos a propósito:
//
//   · Las de botones salen con cuatro opciones (la buena y tres más del mismo
//     modo), no con la botonera entera. Es un examen tipo test: el orden se
//     baraja por alumno, y barajar una botonera de diecisiete notas no se
//     puede contestar en quince segundos.
//   · Las de decir notas o tocar teclas mantienen su botonera o su teclado,
//     sin barajar, y tienen más tiempo.
//
// De servidor: el trivial lee de la base de datos y las respuestas no pueden
// salir de aquí.

import "server-only";

import { ALL_EAR_INTERVALS } from "../earIntervals";
import { CHORD_LEVELS, PROGRESSION_LEVELS, buildChordQuiz, chordNotes, tonicChord } from "../chordEar";
import {
  PAIR_DISTANCES,
  PAIR_LEVELS,
  PAIR_QUALITIES,
  buildPairQuiz,
  findDistance,
  findQuality,
  pairChords,
} from "../chordPair";
import { MELODY_LEVELS, buildMelodyQuiz, melodyAnswer, melodyNotes, melodyTonicChord } from "../melodyEar";
import { EAR_MODES, buildModeQuiz, droneNote, findMode, modeNotes } from "../modeEar";
import { NOTE_READING_LEVELS, answersFor, buildNoteReadingQuiz, noteLabel } from "../noteReading";
import {
  ACORDE_NIVELES,
  ESCALA_NIVELES,
  FILAS_NOTAS,
  acordeQuiz,
  escalaQuiz,
  intervaloQuiz,
  nombreNota,
  type Pregunta,
} from "../noteSpelling";
import { CHORD_BUILD_LEVELS, SCALE_BUILD_LEVELS, buildNotes, buildQuiz } from "../pianoBuild";
import { PIANO_INTERVALS, PIANO_INTERVAL_LEVELS, buildPianoIntervalQuiz } from "../pianoIntervals";
import { PIANO_NOTE_LEVELS, buildPianoNoteQuiz } from "../pianoNotes";
import { RHYTHM_LEVELS, createRhythmScore, rhythmTimeline } from "../rhythm";
import { alterAccidental, spelledName, staffPosition } from "../staff";
import {
  ANSWER_NAMES,
  CHORD_NAME_LEVELS,
  CHORD_SPELL_LEVELS,
  buildChordStaffQuiz,
  chordName,
  chordNoteNames,
} from "../staffChords";
import { STAFF_INTERVALS, STAFF_INTERVAL_LEVELS, allStaffIntervalQuestions } from "../staffIntervals";
import { TRIVIA_GENERAL, findTriviaTopic } from "../trivia";
import { getSupabaseAdmin } from "../supabaseAdmin";
import { shuffleWith, withSeededRandom } from "../seeded";
import { CLAVE_LEVELS, getArmaduras } from "@/app/play/armadura/notes_images";
import { diapason_data } from "@/app/play/diapason/diapason_data";
import { intervalos_data } from "@/app/play/diapason_intervalos/intervalos_data";
import { chords_images as triadas_images } from "@/app/play/diapason_acordes/triadas/chords_images";
import { chords_images as septimas_images } from "@/app/play/diapason_acordes/septimas/chords_images";
import { modes_images } from "@/app/play/modos/modes_images";
import { EXAM_LIMITS, blockLabel, findExamMode } from "./catalog";
import type {
  AnswerKey,
  ExamAudio,
  ExamBlock,
  ExamInput,
  ExamQuestion,
  PromptPart,
} from "./types";

/** Un error que se le puede enseñar tal cual a quien crea el examen. */
export class ExamError extends Error {}

// --- Tiempos -----------------------------------------------------------

/**
 * El tiempo de una pregunta: el que eligió el creador para el bloque, más lo
 * que tarda en sonar. Escuchar no es contestar: si el dictado dura cuatro
 * segundos, no se le quitan al alumno.
 */
const limitFor = (seconds: number, input: ExamInput, audio?: ExamAudio) => {
  let ms = seconds * 1000;
  if (input.type === "taps") ms += Math.ceil(rhythmTimeline(input.score, input.bpm).seconds * 1000);
  if (audio) ms += Math.ceil(audio.seconds * 1000);
  return Math.ceil(ms / 1000) * 1000;
};

// --- Ayudas ------------------------------------------------------------

/** Nombre de un semitono, sin octava. El mismo que pinta el teclado. */
const PIANO_NAMES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
export const keyName = (semitone: number) => PIANO_NAMES[((semitone % 12) + 12) % 12];

/** La buena y tres más del mismo modo, sin repetir. Las primeras de `prefer` van antes. */
const choicesFor = (
  correct: string,
  pool: readonly string[],
  rng: () => number,
  prefer: readonly string[] = [],
) => {
  const others = [...new Set(pool)].filter((option) => option !== correct);
  const preferred = shuffleWith(
    prefer.filter((option) => option !== correct && others.includes(option)),
    rng,
  ).slice(0, 2);
  const rest = shuffleWith(
    others.filter((option) => !preferred.includes(option)),
    rng,
  );
  return [correct, ...preferred, ...rest].slice(0, 4);
};

/** `count` elementos de una baraja, sin repetir mientras queden. */
const deal = <T,>(items: readonly T[], count: number, rng: () => number): T[] => {
  const out: T[] = [];
  while (out.length < count && items.length) {
    out.push(...shuffleWith(items, rng).slice(0, count - out.length));
  }
  return out;
};

interface Draft {
  title: string;
  prompt: PromptPart[];
  input: ExamInput;
  answer: AnswerKey;
  solution: string;
  /** Lo que identifica la pregunta en los resultados ("Escala de Mib mayor"). */
  detail?: string;
}

const choice = (correct: string, options: string[]): Pick<Draft, "input" | "answer" | "solution"> => ({
  input: { type: "choice", options },
  answer: { type: "choice", value: correct },
  solution: correct,
});

const audioOf = (part: PromptPart[]) =>
  part.find((item): item is Extract<PromptPart, { type: "audio" }> => item.type === "audio")?.audio;

// --- Sonidos -----------------------------------------------------------

/** Acordes uno detrás de otro, como `playSequence`. */
const sequenceAudio = (chords: number[][], gap: number, tail = 1.6, bassBoost?: number): ExamAudio => ({
  events: chords.map((notes, index) => ({ at: index * gap, notes })),
  seconds: (chords.length - 1) * gap + tail,
  ...(bassBoost ? { bassBoost } : {}),
});

/** Escala sobre un pedal, como `playOverDrone`. */
const droneAudio = (notes: number[], gap: number, drone: number): ExamAudio => {
  const seconds = notes.length * gap + 1.4;
  return {
    events: notes.map((note, index) => ({ at: 0.25 + index * gap, notes: [note] })),
    drone: { note: drone, seconds },
    seconds,
  };
};

// --- Adaptadores --------------------------------------------------------

type Adapter = (level: string | null, count: number, rng: () => number) => Draft[] | Promise<Draft[]>;

const need = <T,>(value: T | undefined, what: string): T => {
  if (!value) throw new ExamError(`No existe ${what}.`);
  return value;
};

const spellingPad = () =>
  FILAS_NOTAS.map((row) => row.notas.map((nota) => nombreNota(nota)));

const spelling = (pregunta: Pregunta, title: string): Draft => {
  const values = pregunta.notas.map(nombreNota);
  return {
    title,
    prompt: [{ type: "text", lead: pregunta.pide, strong: pregunta.objeto }],
    input: { type: "sequence", pad: spellingPad(), length: values.length, ordered: true },
    answer: { type: "sequence", values },
    solution: values.join(" "),
    detail: `${pregunta.pide} ${pregunta.objeto}`,
  };
};

/** Las imágenes: la ruta se queda en el servidor (ver PromptPart "image"). */
const imageQuiz = <T extends { image: string; answer: string }>(
  data: readonly T[],
  count: number,
  rng: () => number,
  build: (item: T) => { src: string; correct: string; pool: string[]; title: string; fretboard: boolean },
): Draft[] =>
  deal(data, count, rng).map((item) => {
    const { src, correct, pool, title, fretboard } = build(item);
    return {
      title,
      prompt: [{ type: "image", src, fretboard, alt: title }],
      ...choice(correct, choicesFor(correct, pool, rng)),
    };
  });

const ADAPTERS: Record<string, Adapter> = {
  "/play/lectura-notas": (slug, count, rng) => {
    const level = need(NOTE_READING_LEVELS.find((item) => item.slug === slug), "ese nivel");
    return buildNoteReadingQuiz(level, count).map((question) => {
      const correct = noteLabel(question);
      const { degree, accidental } = staffPosition(question.semitone, question.preferFlat);
      return {
        title: "¿Qué nota es?",
        prompt: [{ type: "staff", clef: question.clef, columns: [[{ degree, accidental }]] }],
        ...choice(correct, choicesFor(correct, answersFor(level), rng)),
      };
    });
  },

  "/play/intervalos": (slug, count, rng) => {
    const level = need(STAFF_INTERVAL_LEVELS.find((item) => item.slug === slug), "ese nivel");
    const pool = STAFF_INTERVALS.map((interval) => interval.answer);
    return deal(allStaffIntervalQuestions(level), count, rng).map((question) => ({
      title: "¿Qué intervalo es?",
      prompt: [
        {
          type: "staff",
          clef: level.clef,
          columns: [
            [question.lower, question.upper].map((note) => ({
              degree: note.degree,
              accidental: alterAccidental(note.alter),
            })),
          ],
        },
      ],
      ...choice(question.answer, choicesFor(question.answer, pool, rng)),
    }));
  },

  "/play/acordes-pentagrama": (slug, count, rng) => {
    const [kind, levelSlug] = (slug ?? "").split("/");
    if (kind === "nombrar") {
      const level = need(CHORD_NAME_LEVELS.find((item) => item.slug === levelSlug), "ese nivel");
      return buildChordStaffQuiz(level, count).map((question) => {
        const correct = chordName(question);
        const root = spelledName(question.root);
        const sameRoot = level.shapes.map((shape) => `${root} ${shape.label}`);
        const roots = level.alteredRoots
          ? ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si", "Do#", "Reb", "Mib", "Fa#", "Sol#", "Lab", "Sib"]
          : ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
        const pool = roots.map((name) => `${name} ${question.shape.label}`).concat(sameRoot);
        return {
          title: "¿Qué acorde es?",
          prompt: [
            {
              type: "staff",
              clef: question.clef,
              columns: [
                question.notes.map((note) => ({
                  degree: note.degree,
                  accidental: alterAccidental(note.alter),
                })),
              ],
            },
          ],
          ...choice(correct, choicesFor(correct, pool, rng, sameRoot)),
          detail: question.inversion > 0 ? `${correct} · ${question.inversion}ª inversión` : correct,
        };
      });
    }
    if (kind === "escribir") {
      const level = need(CHORD_SPELL_LEVELS.find((item) => item.slug === levelSlug), "ese nivel");
      return buildChordStaffQuiz(level, count).map((question) => {
        const values = chordNoteNames(question);
        return {
          title: "Escribe el acorde",
          prompt: [{ type: "text", lead: "Las notas de", strong: chordName(question) }],
          input: {
            type: "sequence",
            pad: [ANSWER_NAMES.slice(0, 9), ANSWER_NAMES.slice(9)],
            length: values.length,
            ordered: false,
          },
          answer: { type: "sequence", values },
          solution: values.join(" "),
          detail: chordName(question),
        };
      });
    }
    throw new ExamError("No existe ese nivel.");
  },

  "/play/armadura": (slug, count, rng) => {
    const level = need(CLAVE_LEVELS.find((item) => item.slug === slug), "ese nivel");
    const notes = [
      "Do", "Do#", "Reb", "Re", "Re#", "Mib", "Mi", "Fa", "Fa#", "Solb",
      "Sol", "Sol#", "Lab", "La", "La#", "Sib", "Si", "Dob",
    ];
    // Los datos guardan la tónica como el nombre del archivo ("Dos"); la
    // botonera, como se escribe ("Do#"). La misma traducción que el juego.
    const normalize = (text: string) =>
      (text.split(" ")[0] || "")
        .replace("Dos", "Do#")
        .replace("Res", "Re#")
        .replace("Fas", "Fa#")
        .replace("Sols", "Sol#")
        .replace("Las", "La#");
    return deal(getArmaduras(level.claves), count, rng).map((item) => {
      const major = item.image.includes("M.png");
      const correct = normalize(major ? item.mayor : item.menor);
      const title = `¿Qué tonalidad ${major ? "mayor" : "menor"} es?`;
      return {
        title,
        prompt: [{ type: "image", src: item.image, alt: "Armadura en el pentagrama" }],
        ...choice(correct, choicesFor(correct, notes, rng)),
      };
    });
  },

  "/play/construye-intervalos": (_slug, count) =>
    intervaloQuiz(count).map((pregunta) => spelling(pregunta, "Construye el intervalo")),

  "/play/construye-escalas": (slug, count) => {
    const level = need(ESCALA_NIVELES.find((item) => item.slug === slug), "ese nivel");
    return escalaQuiz(level, count).map((pregunta) => spelling(pregunta, "Construye la escala"));
  },

  "/play/construye-acordes": (slug, count) => {
    const level = need(ACORDE_NIVELES.find((item) => item.slug === slug), "ese nivel");
    return acordeQuiz(level, count).map((pregunta) => spelling(pregunta, "Construye el acorde"));
  },

  "/play/modos": (_slug, count, rng) => {
    const labels: Record<string, string> = {
      Jonico: "Jónico",
      Dorico: "Dórico",
      Frigio: "Frigio",
      Lidio: "Lidio",
      Mixo: "Mixolidio",
      Eolico: "Eólico",
      Locrio: "Locrio",
    };
    return imageQuiz(modes_images, count, rng, (item) => ({
      src: `/assets/modos_griegos/${item.image}`,
      correct: labels[item.answer] ?? item.answer,
      pool: Object.values(labels),
      title: "¿Qué modo es?",
      fretboard: false,
    }));
  },

  "/play/ritmo": (slug, count) => {
    const level = need(RHYTHM_LEVELS.find((item) => item.slug === slug), "ese nivel");
    // Dos compases por pregunta, con su compás de entrada: lo bastante para
    // que sea leer ritmo y lo bastante corto para que quepa en una pregunta.
    return Array.from({ length: count }, () => ({
      title: "Toca el ritmo",
      prompt: [],
      input: { type: "taps", score: createRhythmScore(level, 2), bpm: level.defaultBpm },
      answer: { type: "taps" },
      solution: "Los dos compases enteros y sin golpes de más",
    }));
  },

  "/play/oido": (slug, count, rng) => {
    const harmonic = slug === "armonico";
    if (!harmonic && slug !== "intervalos") throw new ExamError("No existe ese nivel.");
    // Los nombres van por semitonos: el índice es la distancia.
    const pool = ALL_EAR_INTERVALS.map((name, semitones) => ({ name, semitones })).filter(
      (interval) => !harmonic || interval.semitones > 0,
    );
    return Array.from({ length: count }, () => {
      const interval = pool[Math.floor(rng() * pool.length)];
      // El mismo abanico que el juego: de Do a Sol.
      const root = Math.floor(rng() * 8);
      const audio = harmonic
        ? sequenceAudio([[root, root + interval.semitones]], 0)
        : sequenceAudio([[root], [root + interval.semitones]], 0.9);
      return {
        title: "¿Qué intervalo suena?",
        prompt: [{ type: "audio", audio }],
        ...choice(interval.name, choicesFor(interval.name, pool.map((item) => item.name), rng)),
      };
    });
  },

  "/play/oido/acordes": (slug, count, rng) => {
    const pair = PAIR_LEVELS.find((item) => item.slug === slug);
    if (pair) {
      const label = (distanceId: string, qualityId: string) =>
        `${findDistance(distanceId).label} · ${findQuality(qualityId).label}`;
      const pool = PAIR_DISTANCES.flatMap((distance) =>
        PAIR_QUALITIES.map((quality) => label(distance.id, quality.id)),
      );
      return buildPairQuiz(count, pair.firstVariable).map((question) => {
        const correct = label(question.distanceId, question.qualityId);
        const first = `${keyName(question.root)} ${findQuality(question.firstQualityId).label.toLowerCase()}`;
        const sameDistance = PAIR_QUALITIES.map((quality) => label(question.distanceId, quality.id));
        return {
          title: "¿Cuánto sube y de qué tipo es?",
          prompt: [
            { type: "text", lead: "El primero es", strong: first },
            { type: "audio", audio: sequenceAudio(pairChords(question), 1.15, 1.6, 2.2) },
          ],
          ...choice(correct, choicesFor(correct, pool, rng, sameDistance)),
          detail: `Desde ${first}`,
        };
      });
    }
    const level = need(CHORD_LEVELS.find((item) => item.slug === slug), "ese nivel");
    return buildChordQuiz(level, count).map((question) => {
      const option = question.options[0];
      const audio = sequenceAudio([chordNotes(option, question.keyRoot, question.shapes[0])], 0);
      return {
        title: level.heading
          ? `${level.heading.lead} ${level.heading.word.toLowerCase()}${level.heading.tail}`
          : "¿Qué acorde suena?",
        prompt: [{ type: "audio", audio }],
        ...choice(option.label, choicesFor(option.label, level.options.map((item) => item.label), rng)),
      };
    });
  },

  "/play/oido/progresiones": (slug, count) => {
    const level = need(PROGRESSION_LEVELS.find((item) => item.slug === slug), "ese nivel");
    return buildChordQuiz(level, count).map((question) => {
      const chords = question.options.map((option, index) =>
        chordNotes(option, question.keyRoot, question.shapes[index]),
      );
      const values = question.options.map((option) => option.label);
      return {
        title: values.length === 1 ? "¿Qué grado suena?" : "¿Qué grados suenan?",
        prompt: [
          { type: "text", lead: "Primero suena la tónica (I)" },
          { type: "audio", audio: sequenceAudio([tonicChord(question.keyRoot), ...chords], 1.15) },
        ],
        input: {
          type: "sequence",
          pad: [level.options.map((option) => option.label)],
          length: values.length,
          ordered: true,
        },
        answer: { type: "sequence", values },
        solution: values.join(" · "),
      };
    });
  },

  "/play/oido/modos": (_slug, count, rng) =>
    buildModeQuiz(count).map((question) => {
      const correct = findMode(question.modeId).label;
      return {
        title: "¿Qué modo suena?",
        prompt: [
          { type: "audio", audio: droneAudio(modeNotes(question), 0.43, droneNote(question)) },
        ],
        ...choice(correct, choicesFor(correct, EAR_MODES.map((mode) => mode.label), rng)),
      };
    }),

  "/play/oido/dictado": (slug, count) => {
    const level = need(MELODY_LEVELS.find((item) => item.slug === slug), "ese nivel");
    return buildMelodyQuiz(level, count).map((question) => {
      const notes = melodyNotes(question);
      const keys = melodyAnswer(question);
      const tonicAt = 1.25;
      const gap = 0.52;
      const audio: ExamAudio = {
        events: [
          { at: 0, notes: melodyTonicChord(question) },
          ...notes.map((note, index) => ({ at: tonicAt + index * gap, notes: [note] })),
        ],
        seconds: tonicAt + notes.length * gap + 0.8,
      };
      return {
        title: "Toca la melodía",
        prompt: [
          { type: "text", lead: "La primera nota te la damos. Toca las demás." },
          { type: "audio", audio },
        ],
        input: {
          type: "piano",
          from: -12,
          octaves: 3,
          count: keys.length,
          ordered: true,
          exactOctave: true,
          marks: { [notes[0]]: "root" },
          badges: { [notes[0]]: "Empieza" },
        },
        answer: { type: "piano", keys },
        solution: keys.map(keyName).join(" "),
      };
    });
  },

  "/play/diapason": (_slug, count, rng) => {
    const pool = ["Do", "Do#/Reb", "Re", "Re#/Mib", "Mi", "Fa", "Fa#/Solb", "Sol", "Sol#/Lab", "La", "La#/Sib", "Si"];
    return imageQuiz(diapason_data, count, rng, (item) => ({
      src: item.image,
      correct: item.answer,
      pool,
      title: "¿Qué nota es?",
      fretboard: true,
    }));
  },

  "/play/diapason_intervalos": (_slug, count, rng) => {
    const pool = ["Unísono", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7", "8"];
    return imageQuiz(intervalos_data, count, rng, (item) => ({
      src: item.image,
      correct: item.answer === "0" ? "Unísono" : item.answer,
      pool,
      title: "¿Qué intervalo es?",
      fretboard: true,
    }));
  },

  "/play/diapason_acordes": (slug, count, rng) => {
    if (slug === "triadas") {
      const labels: Record<string, string> = { Mayores: "Mayor", Menores: "Menor", aug: "aug", dim: "dim" };
      return imageQuiz(triadas_images, count, rng, (item) => ({
        src: `/assets/diapason_triadas/${item.image}`,
        correct: labels[item.answer] ?? item.answer,
        pool: Object.values(labels),
        title: "¿Qué acorde es?",
        fretboard: true,
      }));
    }
    if (slug === "septimas") {
      const labels: Record<string, string> = { maj7: "maj7", min7: "m7", "7": "7", min7b5: "m7b5" };
      return imageQuiz(septimas_images, count, rng, (item) => ({
        src: `/assets/diapason_septimas/${item.image}`,
        correct: labels[item.answer] ?? item.answer,
        pool: Object.values(labels),
        title: "¿Qué acorde es?",
        fretboard: true,
      }));
    }
    throw new ExamError("No existe ese nivel.");
  },

  "/play/piano/notas": (slug, count) => {
    const level = need(PIANO_NOTE_LEVELS.find((item) => item.slug === slug), "ese nivel");
    return buildPianoNoteQuiz(level, count).map((question) => {
      const { degree, accidental } = staffPosition(question.semitone, question.preferFlat);
      return {
        title: "Toca esta nota",
        prompt: [{ type: "staff", clef: level.clef, columns: [[{ degree, accidental }]] }],
        input: {
          type: "piano",
          from: level.keyboardFrom,
          octaves: level.keyboardOctaves,
          count: 1,
          ordered: true,
          exactOctave: true,
        },
        answer: { type: "piano", keys: [question.semitone] },
        solution: keyName(question.semitone),
      };
    });
  },

  "/play/piano/intervalos": (slug, count) => {
    const level = need(PIANO_INTERVAL_LEVELS.find((item) => item.slug === slug), "ese nivel");
    return buildPianoIntervalQuiz(level, count).map((question) => {
      const target = question.root + question.interval.semitones;
      return {
        title: "Toca el intervalo",
        prompt: [
          {
            type: "text",
            lead: "Desde",
            strong: keyName(question.root),
            tail: `, toca la ${question.interval.name}`,
          },
        ],
        input: {
          type: "piano",
          from: 0,
          octaves: 2,
          count: 1,
          ordered: true,
          exactOctave: true,
          marks: { [question.root]: "root" },
          badges: { [question.root]: "Desde aquí" },
        },
        answer: { type: "piano", keys: [target] },
        solution: keyName(target),
        detail: `${question.interval.name} desde ${keyName(question.root)}`,
      };
    });
  },

  "/play/piano/reconocer-intervalos": (slug, count, rng) => {
    const level = need(PIANO_INTERVAL_LEVELS.find((item) => item.slug === slug), "ese nivel");
    const pool = PIANO_INTERVALS.filter((interval) => level.semitones.includes(interval.semitones)).map(
      (interval) => interval.short,
    );
    return buildPianoIntervalQuiz(level, count).map((question) => ({
      title: "¿Qué intervalo es?",
      prompt: [
        {
          type: "keyboard",
          from: 0,
          octaves: 2,
          marks: {
            [question.root]: "root",
            [question.root + question.interval.semitones]: "hint",
          },
        },
      ],
      ...choice(question.interval.short, choicesFor(question.interval.short, pool, rng)),
    }));
  },

  "/play/piano/acordes": (slug, count) => {
    const level = need(CHORD_BUILD_LEVELS.find((item) => item.slug === slug), "ese nivel");
    return buildQuiz(level, count).map((question) => {
      const keys = buildNotes(question);
      const name = `${keyName(question.root)} ${question.shape.label}`;
      return {
        title: "Monta el acorde",
        prompt: [{ type: "text", lead: "Monta", strong: name }],
        input: { type: "piano", from: 0, octaves: 2, count: keys.length, ordered: false, exactOctave: false },
        answer: { type: "piano", keys },
        solution: keys.map(keyName).join(" "),
        detail: name,
      };
    });
  },

  "/play/piano/escalas": (slug, count) => {
    const level = need(SCALE_BUILD_LEVELS.find((item) => item.slug === slug), "ese nivel");
    return buildQuiz(level, count).map((question) => {
      const keys = buildNotes(question);
      const name = `${keyName(question.root)} ${question.shape.label}`;
      return {
        title: "Toca la escala",
        prompt: [{ type: "text", lead: "Toca la escala de", strong: name }],
        input: { type: "piano", from: 0, octaves: 2, count: keys.length, ordered: true, exactOctave: true },
        answer: { type: "piano", keys },
        solution: keys.map(keyName).join(" "),
        detail: name,
      };
    });
  },

  "/play/trivia": async (slug, count, rng) => {
    const topic = need(findTriviaTopic(slug ?? ""), "ese tema");
    let query = getSupabaseAdmin()
      .from("trivia_questions")
      .select("pregunta, opcion_1, opcion_2, opcion_3, opcion_4, correcta")
      .eq("activa", true)
      .order("pregunta")
      .limit(3000);
    if (topic.slug !== TRIVIA_GENERAL) query = query.eq("tema", topic.slug);

    const { data, error } = await query.returns<
      { pregunta: string; opcion_1: string; opcion_2: string; opcion_3: string; opcion_4: string; correcta: number }[]
    >();
    if (error) throw new Error(`No se han podido leer las preguntas del trivial: ${error.message}`);

    const rows = data ?? [];
    if (rows.length < count) {
      throw new ExamError(
        `Del trivial de ${topic.title} solo hay ${rows.length} preguntas: pide como mucho esas.`,
      );
    }
    return shuffleWith(rows, rng)
      .slice(0, count)
      .map((row) => {
        const options = [row.opcion_1, row.opcion_2, row.opcion_3, row.opcion_4];
        const correct = options[row.correcta - 1];
        return {
          title: `Trivial · ${topic.title}`,
          prompt: [{ type: "text", strong: row.pregunta }],
          ...choice(correct, options),
          detail: row.pregunta,
        };
      });
  },
};

/** Las preguntas de un bloque, ya completas. */
export const generateBlock = async (block: ExamBlock, rng: () => number): Promise<ExamQuestion[]> => {
  const mode = findExamMode(block.mode);
  if (!mode) throw new ExamError("Ese modo no se puede poner en un examen.");
  if (mode.levels.length && !mode.levels.some((level) => level.slug === block.level)) {
    throw new ExamError(`Elige un nivel de ${mode.label}.`);
  }
  const adapter = ADAPTERS[mode.slug];
  if (!adapter) throw new ExamError("Ese modo no se puede poner en un examen.");

  // Todo lo que tire de Math.random dentro del generador del modo usa el azar
  // del examen. El trivial es asíncrono y por eso va aparte: baraja con `rng`.
  const drafts =
    mode.slug === "/play/trivia"
      ? await adapter(block.level, block.count, rng)
      : withSeededRandom(rng, () => adapter(block.level, block.count, rng) as Draft[]);

  const summary = blockLabel(mode.slug, mode.levels.length ? block.level : null);
  return drafts.map((draft) => ({
    mode: mode.slug,
    level: mode.levels.length ? block.level : null,
    title: draft.title,
    prompt: draft.prompt,
    input: draft.input,
    limitMs: limitFor(block.seconds ?? EXAM_LIMITS.secondsDefault, draft.input, audioOf(draft.prompt)),
    answer: draft.answer,
    solution: draft.solution,
    summary: draft.detail ? `${summary} · ${draft.detail}` : summary,
  }));
};
