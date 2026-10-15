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
import type { SpelledNote } from "./staff";

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
  /** La nota de abajo. Siempre natural, como en las fichas de antes. */
  lower: SpelledNote;
  upper: SpelledNote;
  answer: string;
}

/**
 * Las notas de partida: de Do4 a Do5, en grados del pentagrama (Do4 = 0).
 * Son las mismas ocho que tenían las imágenes. Con Do5 y una 7ª mayor se llega
 * a Si5, que en clave de sol cabe con una línea adicional.
 */
const LOWER_DEGREES = [0, 1, 2, 3, 4, 5, 6, 7];

/** Todas las preguntas posibles. Las que pedirían doble alteración se quedan fuera. */
export const allStaffIntervalQuestions = (): StaffIntervalQuestion[] =>
  LOWER_DEGREES.flatMap((degree) =>
    STAFF_INTERVALS.flatMap((interval) => {
      const top = desplazar({ letra: degree % 7, alter: 0 }, interval.grados, interval.semitonos);
      if (!top) return [];

      return [
        {
          lower: { degree, alter: 0 },
          upper: { degree: degree + interval.grados, alter: top.alter },
          answer: interval.answer,
        },
      ];
    }),
  );
