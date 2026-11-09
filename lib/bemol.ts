// La "b" de bemol pegada a la nota se lee mal: "Mib 7" parece "MIB", sobre
// todo en los titulares en mayúsculas. Por dentro la app sigue escribiendo
// "Mib" (es lo que se compara y se guarda); esto solo cambia lo que se pinta.
//
// Solo toca una "b" que va justo detrás de un nombre de nota y que no sigue
// con otra letra, para no estropear palabras como "Labio" o "Rebote".

const BEMOL = /(?<![A-Za-zÀ-ÿ])(Do|Re|Mi|Fa|Sol|La|Si)(bb|b)(?![A-Za-zÀ-ÿ])/g;

/** "Mib 7" → "Mi♭ 7", "Sib mayor" → "Si♭ mayor", "Mibb" → "Mi♭♭". */
export const bemol = (texto: string) =>
  texto.replace(BEMOL, (_, nota: string, b: string) => nota + "♭".repeat(b.length));
