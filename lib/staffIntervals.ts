// Las preguntas de "¿Qué intervalo es?" en el pentagrama.
//
// Antes eran 104 capturas de partitura recortadas a mano, y al recortarlas se
// quedó fuera la clave: sin clave no se sabe qué notas son, así que tampoco qué
// intervalo. Ahora se dibujan con `Staff`, que pone la clave siempre.
//
// El intervalo se cuenta como se cuenta en clase: primero por letras y luego
// por semitonos. De Si a Fa hay cinco letras (Si Do Re Mi Fa), así que es una
// 5ª, y como mide seis semitonos es disminuida. De Fa a Si hay cuatro letras:
// 4ª aumentada, aunque suene igual. Esa cuenta la hace `desplazar`, la misma
// que usa "Construye el intervalo".

import { desplazar } from "./noteSpelling";
import type { Clef, SpelledNote } from "./staff";

export interface StaffInterval {
  /** El cifrado del botón: "b3", "#4", "b5"… */
  answer: string;
  grados: number;
  semitonos: number;
}

/**
 * Los que se preguntan, con el mismo cifrado que la botonera. El unísono y la
 * octava están en la botonera pero no se preguntan, igual que antes: con dos
 * notas en la misma línea o a una octava no hay nada que contar.
 */
export const STAFF_INTERVALS: StaffInterval[] = [
  { answer: "b2", grados: 1, semitonos: 1 },
  { answer: "2", grados: 1, semitonos: 2 },
  { answer: "b3", grados: 2, semitonos: 3 },
  { answer: "3", grados: 2, semitonos: 4 },
  { answer: "4", grados: 3, semitonos: 5 },
  { answer: "#4", grados: 3, semitonos: 6 },
  { answer: "b5", grados: 4, semitonos: 6 },
  { answer: "5", grados: 4, semitonos: 7 },
  { answer: "#5", grados: 4, semitonos: 8 },
  { answer: "b6", grados: 5, semitonos: 8 },
  { answer: "6", grados: 5, semitonos: 9 },
  { answer: "b7", grados: 6, semitonos: 10 },
  { answer: "7", grados: 6, semitonos: 11 },
];

export interface StaffIntervalQuestion {
  lower: SpelledNote;
  upper: SpelledNote;
  answer: string;
}

export interface StaffIntervalLevel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  clef: Clef;
  /** false = las dos notas naturales; true = cualquiera de las dos puede llevar ♯ o ♭. */
  accidentals: boolean;
}

/**
 * Como en Lectura de notas: primero sin alteraciones, en sol y en fa, que solo
 * pide contar letras y saber dónde están Mi-Fa y Si-Do; luego con
 * alteraciones, que pide además contar semitonos.
 *
 * Con alteraciones mezcla de todo a propósito (naturales, la de arriba
 * alterada, la de abajo, las dos): si todas llevaran alteración, o siempre en
 * la misma nota, eso ya sería una pista. Las partidas de antes de los niveles
 * (sol, la de abajo natural) se pasaron a "sol-alteraciones"
 * (db/intervalos_niveles.sql).
 */
export const STAFF_INTERVAL_LEVELS: StaffIntervalLevel[] = [
  {
    slug: "sol-naturales",
    title: "Clave de sol",
    desc: "Sin alteraciones. Cuenta las letras y fíjate en dónde caen Mi-Fa y Si-Do.",
    badge: "Nivel 1",
    clef: "sol",
    accidentals: false,
  },
  {
    slug: "fa-naturales",
    title: "Clave de fa",
    desc: "Lo mismo en clave de fa: los intervalos no cambian, las notas sí.",
    badge: "Nivel 2",
    clef: "fa",
    accidentals: false,
  },
  {
    slug: "sol-alteraciones",
    title: "Sol con alteraciones",
    desc: "Sostenidos y bemoles en cualquiera de las dos notas. Fa#–Do no es lo mismo que Fa–Do.",
    badge: "Nivel 3",
    clef: "sol",
    accidentals: true,
  },
  {
    slug: "fa-alteraciones",
    title: "Fa con alteraciones",
    desc: "Lo del nivel 3, en clave de fa.",
    badge: "Nivel 4",
    clef: "fa",
    accidentals: true,
  },
];

export const findStaffIntervalLevel = (slug: string) =>
  STAFF_INTERVAL_LEVELS.find((level) => level.slug === slug);

/**
 * Las notas de partida, en grados del pentagrama (Do4 = 0).
 *
 * En sol, de Do4 a Do5: las mismas ocho que tenían las imágenes. Con Do5 y una
 * 7ª mayor se llega a Si5, que cabe con una línea adicional.
 *
 * En fa, las mismas posiciones en el pentagrama: la clave de fa está doce
 * grados por debajo (su primera línea es Sol2 y la de sol, Mi4), así que de Mi2
 * a Mi3. Se ven igual de cómodas y caben igual.
 */
const LOWER_DEGREES: Record<Clef, number[]> = {
  sol: [0, 1, 2, 3, 4, 5, 6, 7],
  fa: [-12, -11, -10, -9, -8, -7, -6, -5],
};

/** La letra de un grado (0 = Do … 6 = Si), también bajo el Do central. */
const letterOf = (degree: number) => ((degree % 7) + 7) % 7;

/**
 * Las alteradas que caen en tecla blanca (Mi#, Si#, Fab, Dob) no salen como
 * nota de abajo: existen, pero en una ficha de intervalos para empezar solo
 * despistan. Arriba sí pueden salir, porque ahí las pide el intervalo.
 */
const RARE_LOWER = new Set(["2:1", "6:1", "3:-1", "0:-1"]);

/** Todas las preguntas de un nivel. Las que pedirían doble alteración se quedan fuera. */
export const allStaffIntervalQuestions = (level: StaffIntervalLevel): StaffIntervalQuestion[] =>
  LOWER_DEGREES[level.clef].flatMap((degree) =>
    (level.accidentals ? [0, -1, 1] : [0]).flatMap((alter) => {
      const letra = letterOf(degree);
      if (RARE_LOWER.has(`${letra}:${alter}`)) return [];

      return STAFF_INTERVALS.flatMap((interval) => {
        const top = desplazar({ letra, alter }, interval.grados, interval.semitonos);
        if (!top || (!level.accidentals && top.alter !== 0)) return [];

        return [
          {
            lower: { degree, alter },
            upper: { degree: degree + interval.grados, alter: top.alter },
            answer: interval.answer,
          },
        ];
      });
    }),
  );
