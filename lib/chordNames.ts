// Cómo se escribe un acorde en toda la app.
//
// Es un archivo de convenio, no de lógica: aquí no se calcula nada, solo se
// deja escrito de una vez cómo se llaman las cosas para que no haya un "Maj7"
// en un modo y un "maj7" en el de al lado.
//
// EL CIFRADO DISTINGUE MAYÚSCULAS Y MINÚSCULAS. No es un detalle de estilo:
//
//   m7b5  = semidisminuido (tríada MENOR con 5ª bemol y 7ª menor)
//   M7    = en muchos métodos, séptima MAYOR
//
// Así que un "m7b5" escrito en mayúsculas dice literalmente otro acorde. Por
// eso cualquier titular que lleve `uppercase` tiene que envolver el nombre del
// acorde en `normal-case`. Si en algún modo nuevo se pinta un acorde dentro de
// un texto en mayúsculas, esto es lo que hay que acordarse de hacer.
//
// El bemol va con la "b" de siempre y no con el signo ♭: el resto de la app ya
// escribe "Sib", "Mib" y "b3", y mezclar los dos sistemas se lee peor que
// tener uno solo, aunque sea el pobre.

/**
 * El cifrado de cada calidad: lo que se escribe pegado a la fundamental.
 * "Do" + MAYOR = "Do", "Do" + MENOR_7 = "Do m7".
 */
export const CHORD_SUFFIX = {
  MAYOR: "",
  MENOR: "m",
  AUMENTADO: "aug",
  DISMINUIDO: "dim",
  MAJ7: "maj7",
  MENOR_7: "m7",
  DOMINANTE: "7",
  SEMIDISMINUIDO: "m7b5",
  DISMINUIDO_7: "dim7",
  MENOR_6: "m6",
  MENOR_MAJ7: "m(maj7)",
} as const;

/**
 * Cómo se dice en palabras, para cuando hay sitio y se lee mejor hablado
 * ("séptima mayor" es más claro que "maj7" para quien empieza).
 */
export const CHORD_WORDS = {
  MAYOR: "mayor",
  MENOR: "menor",
  AUMENTADO: "aumentado",
  DISMINUIDO: "disminuido",
  MAJ7: "séptima mayor",
  MENOR_7: "séptima menor",
  DOMINANTE: "dominante",
  SEMIDISMINUIDO: "semidisminuido",
  DISMINUIDO_7: "séptima disminuida",
} as const;
