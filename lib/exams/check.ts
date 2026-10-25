// Corregir una pregunta de examen. Las reglas son las de cada juego:
//
//   · deletrear una escala o un acorde va en orden (NotasGame), salvo
//     "Escribe el acorde", que acepta cualquier orden (ChordSpellGame);
//   · en el piano, un acorde vale en cualquier orden y octava, y una escala o
//     una melodía, tecla a tecla (PianoBuildGame, MelodyEarGame);
//   · un ritmo vale si están bien todos sus compases (MusicDisplay).

import { evaluateRhythmTaps } from "../rhythm";
import type { ExamQuestion, GivenAnswer } from "./types";

const PIANO_NAMES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const pitchClass = (semitone: number) => ((semitone % 12) + 12) % 12;

const asStrings = (given: GivenAnswer) =>
  Array.isArray(given) ? given.map((item) => String(item)) : [];

const asNumbers = (given: GivenAnswer) =>
  Array.isArray(given)
    ? given.map((item) => Number(item)).filter((item) => Number.isFinite(item))
    : [];

const sameList = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((item, i) => item === b[i]);
const sameSet = <T,>(a: T[], b: T[]) => {
  const sort = (list: T[]) => [...list].map(String).sort();
  return sameList(sort(a), sort(b));
};

export const isCorrect = (question: ExamQuestion, given: GivenAnswer): boolean => {
  if (given === null) return false;
  const { answer, input } = question;

  if (answer.type === "choice") return typeof given === "string" && given === answer.value;

  if (answer.type === "sequence" && input.type === "sequence") {
    const values = asStrings(given);
    return input.ordered ? sameList(values, answer.values) : sameSet(values, answer.values);
  }

  if (answer.type === "piano" && input.type === "piano") {
    const keys = asNumbers(given);
    if (input.exactOctave) {
      return input.ordered ? sameList(keys, answer.keys) : sameSet(keys, answer.keys);
    }
    return sameSet(keys.map(pitchClass), answer.keys.map(pitchClass));
  }

  if (answer.type === "taps" && input.type === "taps") {
    const taps = asNumbers(given).slice(0, 400);
    const { correctMeasures, totalMeasures } = evaluateRhythmTaps(input.score, input.bpm, taps);
    return totalMeasures > 0 && correctMeasures === totalMeasures;
  }

  return false;
};

/** Cómo se lee lo contestado, para los resultados. */
export const describeGiven = (question: ExamQuestion, given: GivenAnswer): string => {
  if (given === null) return "Sin contestar";
  const { input } = question;

  if (input.type === "choice") return String(given);
  if (input.type === "sequence") return asStrings(given).join(input.length > 1 ? " " : "") || "—";
  if (input.type === "piano") return asNumbers(given).map((key) => PIANO_NAMES[pitchClass(key)]).join(" ") || "—";
  if (input.type === "taps") {
    const { correctMeasures, totalMeasures } = evaluateRhythmTaps(
      input.score,
      input.bpm,
      asNumbers(given),
    );
    return `${correctMeasures} de ${totalMeasures} compases bien`;
  }
  return String(given);
};

/** La nota sobre 10, con un decimal: 7,5. */
export const gradeOf = (correct: number, total: number) =>
  total > 0 ? Math.round((correct / total) * 100) / 10 : 0;

export const formatGrade = (grade: number) => grade.toLocaleString("es-ES", { maximumFractionDigits: 1 });
