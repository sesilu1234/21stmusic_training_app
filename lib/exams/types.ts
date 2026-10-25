// Cómo es una pregunta de examen.
//
// Hay veintitrés modos y cada uno pregunta a su manera, pero todos caben en
// tres piezas:
//
//   · lo que se enseña (`PromptPart`): un pentagrama, una imagen, un sonido,
//     un texto, un teclado con teclas encendidas… o varias cosas a la vez;
//   · cómo se contesta (`ExamInput`): elegir una opción, decir notas en orden,
//     pulsar teclas del piano o dar los golpes de un ritmo;
//   · la respuesta buena (`AnswerKey`), que solo conoce el servidor.
//
// La pregunta entera (`ExamQuestion`) se guarda en exams.questions. Lo que
// viaja al navegador es `PublicQuestion`: lo mismo sin `answer` ni `solution`.

import type { Clef } from "../staff";
import type { StaffColumn } from "@/app/components/Staff";
import type { ScoreItem } from "../rhythm";

export type KeyMarkKind = "root" | "hint";

export type PromptPart =
  | { type: "text"; lead?: string; strong?: string; tail?: string }
  | { type: "staff"; clef: Clef; columns: StaffColumn[]; head?: "black" | "whole" }
  /**
   * La imagen nunca lleva su ruta: el nombre del archivo canta la respuesta
   * ("SolM.png"). El navegador la pide a /e/[code]/imagen y el servidor la
   * sirve sin decir de dónde sale. `src` solo existe en el lado del servidor.
   */
  | { type: "image"; src?: string; fretboard?: boolean; alt: string }
  | { type: "audio"; audio: ExamAudio }
  | {
      type: "keyboard";
      from: number;
      octaves: number;
      marks: Record<number, KeyMarkKind>;
    };

/**
 * Lo que suena. Todo en segundos desde que se pulsa "Escuchar" y en semitonos
 * con 0 = Do central, como app/play/oido/audio.ts.
 */
export interface ExamAudio {
  /** Cada evento: cuándo y qué notas a la vez. */
  events: { at: number; notes: number[] }[];
  /** Un pedal debajo (modos al oído). */
  drone?: { note: number; seconds: number };
  /** Realce del bajo (dos acordes seguidos). */
  bassBoost?: number;
  /** Cuánto dura todo, para saber cuándo se ha acabado de oír. */
  seconds: number;
}

export type ExamInput =
  /** Elegir una. Las opciones se barajan por alumno. */
  | { type: "choice"; options: string[] }
  /**
   * Decir varias cosas de una botonera fija (notas, grados), en orden o no.
   * La botonera NO se baraja: que los botones estén siempre en su sitio es
   * medio ejercicio.
   */
  | { type: "sequence"; pad: string[][]; length: number; ordered: boolean }
  /** Pulsar teclas del piano. */
  | {
      type: "piano";
      from: number;
      octaves: number;
      count: number;
      ordered: boolean;
      /** true = solo vale ESA tecla; false = vale cualquier octava (acordes). */
      exactOctave: boolean;
      /** Teclas marcadas de entrada: la de partida, la nota que se da hecha. */
      marks?: Record<number, KeyMarkKind>;
      badges?: Record<number, string>;
    }
  /** Dar los golpes de un ritmo con el metrónomo. */
  | { type: "taps"; score: ScoreItem[]; bpm: number };

export type AnswerKey =
  | { type: "choice"; value: string }
  | { type: "sequence"; values: string[] }
  | { type: "piano"; keys: number[] }
  | { type: "taps" };

/** Lo que manda el navegador al contestar. null = se acabó el tiempo sin contestar. */
export type GivenAnswer = string | string[] | number[] | null;

export interface ExamQuestion {
  /** El modo (su slug, /play/…) y el nivel, para los resultados. */
  mode: string;
  level: string | null;
  /** El enunciado: "¿Qué nota es?". */
  title: string;
  prompt: PromptPart[];
  input: ExamInput;
  /** Tiempo para contestar, en milisegundos. */
  limitMs: number;
  /** Solo servidor. */
  answer: AnswerKey;
  /** Cómo se dice la respuesta buena: "Do#", "Re menor", "Do Mi Sol". */
  solution: string;
  /** Una línea para los resultados del creador: "Lectura de notas · Clave de sol". */
  summary: string;
}

/** Lo que ve quien hace el examen: sin respuesta. */
export interface PublicQuestion {
  /** Posición en SU orden, desde 0. */
  index: number;
  total: number;
  title: string;
  prompt: PromptPart[];
  input: ExamInput;
  limitMs: number;
  /** Lo que le queda, medido en el servidor. */
  remainingMs: number;
}

export interface ExamBlock {
  mode: string;
  level: string | null;
  count: number;
  /**
   * Segundos para contestar cada pregunta del bloque. Lo que tarda en sonar
   * (oído, dictado, ritmo) va aparte y se suma solo. Los exámenes de antes no
   * lo llevan: sus preguntas ya tienen el tiempo guardado.
   */
  seconds?: number;
}

/** Una respuesta guardada en exam_attempts.answers. */
export interface StoredAnswer {
  /** Índice de la pregunta en exams.questions (no en el orden del alumno). */
  q: number;
  given: GivenAnswer;
  correct: boolean;
  timedOut: boolean;
  ms: number;
}
