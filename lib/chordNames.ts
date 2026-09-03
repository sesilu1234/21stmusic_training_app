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
 * Cómo se dice detrás de la nota: "Mi dim", "Do Mayor", "Fa aug".
 *
 * Las tríadas van con el nombre corto y no con la palabra entera —"dim" y no
 * "disminuido", "aug" y no "aumentado"— porque es lo que se escribe en una
 * partitura y en un cifrado, y era raro que la app dijera "Mi disminuido"
 * mientras el papel pone "Mi dim".
 *
 * MAYOR va con eme MAYÚSCULA por lo mismo que el resto del archivo: "Do Mayor"
 * frente a "Do menor" se distingue de un vistazo, igual que la M y la m del
 * cifrado. No es un capricho tipográfico.
 */
export const CHORD_WORDS = {
  MAYOR: "Mayor",
  MENOR: "menor",
  AUMENTADO: "aug",
  DISMINUIDO: "dim",
  MAJ7: "séptima mayor",
  MENOR_7: "séptima menor",
  DOMINANTE: "dominante",
  SEMIDISMINUIDO: "semidisminuido",
  DISMINUIDO_7: "séptima disminuida",
} as const;
