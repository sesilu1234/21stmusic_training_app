// Escalas, intervalos y acordes dichos con el nombre de las notas.
//
// Es el único sitio de la app donde una nota NO es un número de semitonos.
// En el piano y en el diapasón da igual escribir Fa# o Solb: se pulsa la misma
// tecla y el juego la da por buena. En lenguaje musical eso es justo lo que se
// está aprendiendo a distinguir: la escala de Fa# mayor lleva Mi#, no Fa, y el
// acorde de Reb lleva Fa, no Mi#. Así que aquí una nota es una LETRA (Do, Re,
// Mi…) más una alteración, y dos notas que suenan igual pero se escriben
// distinto son dos notas distintas.
//
// De ahí sale todo lo demás: los intervalos se cuentan en letras y en
// semitonos a la vez (una 4ª aumentada y una 5ª disminuida miden seis
// semitonos, pero no se escriben igual), y una pregunta solo vale si su
// respuesta se puede escribir con una alteración como mucho — que es lo que
// hay en la botonera. Ver `desplazar`.

import { CHORD_SUFFIX, CHORD_WORDS } from "./chordNames";

/** Do, Re, Mi… tal y como se escriben. El índice es la letra. */
export const LETRAS = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"] as const;

/** Qué semitono es cada letra sin alterar, contando desde Do. */
const NATURALES = [0, 2, 4, 5, 7, 9, 11];

export interface Nota {
  /** 0 = Do … 6 = Si. */
  letra: number;
  /** -1 bemol, 0 natural, 1 sostenido. */
  alter: number;
}

export const nombreNota = ({ letra, alter }: Nota) =>
  LETRAS[letra] + (alter > 0 ? "#".repeat(alter) : "b".repeat(-alter));

/** Su semitono dentro de la octava. Fa# y Solb dan el mismo: por eso no basta. */
export const alturaNota = ({ letra, alter }: Nota) =>
  (((NATURALES[letra] + alter) % 12) + 12) % 12;

export const mismaNota = (a: Nota, b: Nota) =>
  a.letra === b.letra && a.alter === b.alter;

/** "Sib" → { letra: 6… }. Solo para escribir las listas de abajo a mano. */
export const leerNota = (nombre: string): Nota => {
  const letra = LETRAS.findIndex((item) => nombre.startsWith(item));
  if (letra < 0) throw new Error(`Nota desconocida: ${nombre}`);

  const resto = nombre.slice(LETRAS[letra].length);
  const alter = resto === "#" ? 1 : resto === "b" ? -1 : 0;
  return { letra, alter };
};

const notas = (lista: string) => lista.split(" ").map(leerNota);

/**
 * La botonera: las siete letras por bemol, natural y sostenido.
 *
 * Están las veintiuna SIEMPRE, también las raras (Dob, Fab, Mi#, Si#), y en
 * todos los niveles. Que los botones no se muevan nunca es medio ejercicio:
 * la columna dice la letra y la fila la alteración, y se acaba pulsando sin
 * buscar. Esconder las que no tocan en cada nivel sería además un chivatazo:
 * media respuesta está en qué botones hay.
 *
 * De fuera se lee ya colocado: la fila de sostenidos arriba y la de bemoles
 * abajo, como suben y bajan.
 */
export const FILAS_NOTAS: { alter: number; notas: Nota[] }[] = [1, 0, -1].map(
  (alter) => ({
    alter,
    notas: LETRAS.map((_, letra) => ({ letra, alter })),
  }),
);

/**
 * La nota que sale al subir (o bajar) `grados` letras y `semitonos` semitonos.
 *
 * `grados` es la distancia en letras, no en notas: de Do a Mi son 2, aunque
 * sea una tercera. Los dos números juntos son los que dan la escritura — subir
 * tres semitonos desde Do es Mib si se cuenta como tercera y Re# si se cuenta
 * como segunda.
 *
 * Devuelve null cuando haría falta un doble sostenido o un doble bemol (Sol#
 * mayor pide Fa##). No es una limitación técnica sino la de la botonera, que
 * llega hasta una alteración: una pregunta cuya respuesta no se pueda pulsar
 * no es una pregunta, así que el generador las descarta con esto.
 */
export const desplazar = (
  desde: Nota,
  grados: number,
  semitonos: number,
): Nota | null => {
  const letra = (((desde.letra + grados) % 7) + 7) % 7;
  const objetivo = (((alturaNota(desde) + semitonos) % 12) + 12) % 12;

  let alter = (((objetivo - NATURALES[letra]) % 12) + 12) % 12;
  // El resto va de 0 a 11 y lo que queremos es la alteración más corta: un +11
  // es en realidad un -1.
  if (alter > 6) alter -= 12;

  return Math.abs(alter) > 1 ? null : { letra, alter };
};

// --- Fórmulas ---------------------------------------------------------
//
// Una fórmula es la receta de una escala o de un acorde: cada nota, dicha en
// letras y en semitonos desde la fundamental. Escribirlas así (y no como una
// lista de semitonos, que es como van en los modos de piano) es lo que hace
// que la escala de Reb salga con sus bemoles y no medio escrita con
// sostenidos.

export interface Formula {
  id: string;
  /** Cómo se llama detrás de la nota: "mayor", "m7", "dórico"… */
  label: string;
  /** Una por nota: [letras que sube, semitonos que sube]. */
  notas: [number, number][];
}

const escala = (id: string, label: string, semitonos: number[]): Formula => ({
  id,
  label,
  notas: semitonos.map((semitono, grado): [number, number] => [
    grado,
    semitono,
  ]),
});

// Las siete de la escala, sin repetir la fundamental arriba: la octava se
// llama igual que la primera y pulsarla otra vez no enseña nada.
const MAYOR = escala("mayor", "mayor", [0, 2, 4, 5, 7, 9, 11]);
const MENOR = escala("menor", "menor natural", [0, 2, 3, 5, 7, 8, 10]);
const ARMONICA = escala("armonica", "menor armónica", [0, 2, 3, 5, 7, 8, 11]);
const MELODICA = escala("melodica", "menor melódica", [0, 2, 3, 5, 7, 9, 11]);

const JONICO = escala("jonico", "jónico", [0, 2, 4, 5, 7, 9, 11]);
const DORICO = escala("dorico", "dórico", [0, 2, 3, 5, 7, 9, 10]);
const FRIGIO = escala("frigio", "frigio", [0, 1, 3, 5, 7, 8, 10]);
const LIDIO = escala("lidio", "lidio", [0, 2, 4, 6, 7, 9, 11]);
const MIXOLIDIO = escala("mixolidio", "mixolidio", [0, 2, 4, 5, 7, 9, 10]);
const EOLICO = escala("eolico", "eólico", [0, 2, 3, 5, 7, 8, 10]);
const LOCRIO = escala("locrio", "locrio", [0, 1, 3, 5, 6, 8, 10]);

// --- Las raras --------------------------------------------------------
//
// Las de aquí abajo no caben todas en `escala()`, que reparte una letra por
// nota: una pentatónica tiene cinco notas y siete letras, y la de blues repite
// letra (la b5 y la 5 son Mib y Mi). Así que estas llevan escrito a mano qué
// letra usa cada nota, que es justo lo que hay que aprender de ellas.
const rara = (
  id: string,
  label: string,
  notas: [number, number][],
): Formula => ({
  id,
  label,
  notas,
});

const PENTA_MAYOR = rara("penta-M", "pentatónica mayor", [
  [0, 0],
  [1, 2],
  [2, 4],
  [4, 7],
  [5, 9],
]);

const PENTA_MENOR = rara("penta-m", "pentatónica menor", [
  [0, 0],
  [2, 3],
  [3, 5],
  [4, 7],
  [6, 10],
]);

// La b5 y la 5 comparten letra (La → Mib, Mi): es la nota de paso del blues y
// se escribe así, no como #4.
const BLUES = rara("blues", "de blues", [
  [0, 0],
  [2, 3],
  [3, 5],
  [4, 6],
  [4, 7],
  [6, 10],
]);

// Seis notas y siete letras: una se queda fuera, y por eso desde según qué
// nota no se puede escribir sin dobles (el generador la descarta).
const HEXATONA = rara("hexatona", "hexátona", [
  [0, 0],
  [1, 2],
  [2, 4],
  [3, 6],
  [4, 8],
  [5, 10],
]);

const FRIGIA_DOM = rara("frigia-dom", "frigia dominante", [
  [0, 0],
  [1, 1],
  [2, 4],
  [3, 5],
  [4, 7],
  [5, 8],
  [6, 10],
]);

const LIDIA_B7 = rara("lidia-b7", "lidia b7", [
  [0, 0],
  [1, 2],
  [2, 4],
  [3, 6],
  [4, 7],
  [5, 9],
  [6, 10],
]);

const ALTERADA = rara("alterada", "alterada", [
  [0, 0],
  [1, 1],
  [2, 3],
  [3, 4],
  [4, 6],
  [5, 8],
  [6, 10],
]);

const HUNGARA = rara("hungara", "menor húngara", [
  [0, 0],
  [1, 2],
  [2, 3],
  [3, 6],
  [4, 7],
  [5, 8],
  [6, 11],
]);

/** Acorde: fundamental, tercera, quinta y, si la hay, séptima. */
const acorde = (id: string, label: string, semitonos: number[]): Formula => ({
  id,
  label,
  // Por terceras: fundamental, tercera, quinta, séptima. De ahí el salto de
  // dos letras entre nota y nota.
  notas: semitonos.map((semitono, index): [number, number] => [
    index * 2,
    semitono,
  ]),
});

const AC_MAYOR = acorde("M", CHORD_WORDS.MAYOR, [0, 4, 7]);
const AC_MENOR = acorde("m", CHORD_WORDS.MENOR, [0, 3, 7]);
const AC_DIM = acorde("dim", CHORD_WORDS.DISMINUIDO, [0, 3, 6]);
const AC_AUG = acorde("aug", CHORD_WORDS.AUMENTADO, [0, 4, 8]);

const AC_MAJ7 = acorde("maj7", CHORD_SUFFIX.MAJ7, [0, 4, 7, 11]);
const AC_M7 = acorde("m7", CHORD_SUFFIX.MENOR_7, [0, 3, 7, 10]);
const AC_DOM7 = acorde("7", CHORD_SUFFIX.DOMINANTE, [0, 4, 7, 10]);
const AC_M7B5 = acorde("m7b5", CHORD_SUFFIX.SEMIDISMINUIDO, [0, 3, 6, 10]);
const AC_DIM7 = acorde("dim7", CHORD_SUFFIX.DISMINUIDO_7, [0, 3, 6, 9]);

// --- Intervalos -------------------------------------------------------

export interface Intervalo {
  id: string;
  /** "3ª menor", "5ª disminuida"… */
  label: string;
  grados: number;
  semitonos: number;
}

/**
 * Los que se preguntan, de la segunda a la séptima.
 *
 * Van con el nombre entero y no con el cifrado corto ("b3", "b5") que usan los
 * modos de oído: aquí el ejercicio es precisamente que una 4ª aumentada y una
 * 5ª disminuida miden lo mismo y se escriben distinto, y el cifrado corto no
 * sabe decir esa diferencia.
 *
 * El unísono y la octava no están: la respuesta es la nota de la pregunta.
 */
export const INTERVALOS: Intervalo[] = [
  { id: "2m", label: "2ª menor", grados: 1, semitonos: 1 },
  { id: "2M", label: "2ª mayor", grados: 1, semitonos: 2 },
  { id: "3m", label: "3ª menor", grados: 2, semitonos: 3 },
  { id: "3M", label: "3ª mayor", grados: 2, semitonos: 4 },
  { id: "4J", label: "4ª justa", grados: 3, semitonos: 5 },
  { id: "4A", label: "4ª aumentada", grados: 3, semitonos: 6 },
  { id: "5d", label: "5ª disminuida", grados: 4, semitonos: 6 },
  { id: "5J", label: "5ª justa", grados: 4, semitonos: 7 },
  { id: "6m", label: "6ª menor", grados: 5, semitonos: 8 },
  { id: "6M", label: "6ª mayor", grados: 5, semitonos: 9 },
  { id: "7m", label: "7ª menor", grados: 6, semitonos: 10 },
  { id: "7M", label: "7ª mayor", grados: 6, semitonos: 11 },
];

// --- Niveles ----------------------------------------------------------

export interface DeletreoNivel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  formulas: Formula[];
  /** De dónde pueden salir las preguntas. Las que no se puedan escribir caen. */
  fundamentales: Nota[];
}

/** Las quince tonalidades mayores, de siete bemoles a siete sostenidos. */
/**
 * LO QUE SE PREGUNTA NO SE ESCRIBE DE CUALQUIER MANERA.
 *
 * Una nota puede salir como RESPUESTA con la escritura que le toque —la 2ª
 * mayor de Do# es Re#, y así hay que decirla—, pero como punto de partida no
 * vale cualquiera: no se pide "el acorde de Re#" ni "la escala de Sol#", se
 * piden los de Mib y Lab. Es lo que se escribe en una partitura y lo que se
 * dice en clase; preguntar por Re# sería enseñar a nombrar mal.
 *
 * Por eso las listas de abajo no llevan Re#, Sol#, La#, Mi#, Si# ni Fab, y sí
 * los llevan sus equivalentes de siempre.
 */

/** Las quince tonalidades, de siete bemoles a siete sostenidos. */
const TONALIDADES = notas(
  "Dob Solb Reb Lab Mib Sib Fa Do Sol Re La Mi Si Fa# Do#",
);

const FACILES = notas("Do Sol Re La Fa Sib Mib");
const NATURALES_7 = notas("Do Re Mi Fa Sol La Si");

/** Las catorce fundamentales de las que se habla al cifrar un acorde. */
const FUNDAMENTALES = notas(
  "Do Do# Reb Re Mib Mi Fa Fa# Solb Sol Lab La Sib Si",
);

export const ESCALA_NIVELES: DeletreoNivel[] = [
  {
    slug: "mayores-facil",
    title: "La escala mayor",
    desc: "Las tonalidades de hasta tres alteraciones, que son las de casi todo.",
    badge: "Nivel 1",
    formulas: [MAYOR],
    fundamentales: FACILES,
  },
  {
    slug: "mayores",
    title: "Todas las mayores",
    desc: "Las quince tonalidades, de Dob a Do#. Aquí se aprende a no mezclar bemoles con sostenidos.",
    badge: "Nivel 2",
    formulas: [MAYOR],
    fundamentales: TONALIDADES,
  },
  {
    slug: "menores",
    title: "Las tres menores",
    desc: "Natural, armónica y melódica: las mismas notas menos el 6º y el 7º grado.",
    badge: "Nivel 3",
    formulas: [MENOR, ARMONICA, MELODICA],
    fundamentales: TONALIDADES,
  },
  {
    slug: "modos",
    title: "Modos griegos",
    desc: "Los siete modos desde cualquier nota, sin pensar en el pentagrama.",
    badge: "Nivel 4",
    formulas: [JONICO, DORICO, FRIGIO, LIDIO, MIXOLIDIO, EOLICO, LOCRIO],
    fundamentales: FUNDAMENTALES,
  },
  {
    slug: "raras",
    title: "Otras escalas",
    desc: "Pentatónicas, blues, hexátona, frigia dominante, lidia b7, alterada y menor húngara. De todo tipo y de cualquier tamaño.",
    badge: "Nivel 5",
    formulas: [
      PENTA_MAYOR,
      PENTA_MENOR,
      BLUES,
      HEXATONA,
      FRIGIA_DOM,
      LIDIA_B7,
      ALTERADA,
      HUNGARA,
    ],
    fundamentales: FUNDAMENTALES,
  },
];

export const ACORDE_NIVELES: DeletreoNivel[] = [
  {
    slug: "mayor-menor",
    title: "Mayores y menores",
    desc: "Las dos tríadas de siempre, desde las siete notas naturales.",
    badge: "Nivel 1",
    formulas: [AC_MAYOR, AC_MENOR],
    fundamentales: NATURALES_7,
  },
  {
    slug: "triadas",
    title: "Las cuatro tríadas",
    desc: "Se añaden el disminuido y el aumentado, y las fundamentales alteradas.",
    badge: "Nivel 2",
    formulas: [AC_MAYOR, AC_MENOR, AC_DIM, AC_AUG],
    fundamentales: FUNDAMENTALES,
  },
  {
    slug: "cuatriadas",
    title: "Cuatríadas",
    desc: "Cuatro notas: maj7, m7, dominante, semidisminuido y disminuido.",
    badge: "Nivel 3",
    formulas: [AC_MAJ7, AC_M7, AC_DOM7, AC_M7B5, AC_DIM7],
    fundamentales: FUNDAMENTALES,
  },
  {
    slug: "todo",
    title: "Todo, desde donde sea",
    desc: "Tríadas y cuatríadas, desde cualquier nota con alteración o sin ella.",
    badge: "Nivel 4",
    formulas: [
      AC_MAYOR,
      AC_MENOR,
      AC_DIM,
      AC_AUG,
      AC_MAJ7,
      AC_M7,
      AC_DOM7,
      AC_M7B5,
      AC_DIM7,
    ],
    fundamentales: FUNDAMENTALES,
  },
];

export const findEscalaNivel = (slug: string) =>
  ESCALA_NIVELES.find((nivel) => nivel.slug === slug);

export const findAcordeNivel = (slug: string) =>
  ACORDE_NIVELES.find((nivel) => nivel.slug === slug);

// --- Preguntas --------------------------------------------------------

export interface Pregunta {
  /** La orden: "Escala de", "Monta", "Sube una 3ª menor desde". */
  pide: string;
  /** Lo que va destacado: "Mib mayor", "Fa# m7", "Sib". */
  objeto: string;
  /** La respuesta, en orden. */
  notas: Nota[];
  /** Semitonos para oírla, con la nota de referencia delante si la hay. */
  sonido: number[];
  /** true = suena a la vez, como el acorde que es. */
  juntas: boolean;
}

/**
 * Las notas de una escala o un acorde, o null si alguna pide doble alteración.
 *
 * Que una fórmula no valga desde una fundamental no es un error: Sol# mayor
 * existe, se escribe con Fa## y no cabe en la botonera. Se descarta la
 * pregunta y ya.
 */
const notasDe = (fundamental: Nota, formula: Formula): Nota[] | null => {
  const salida: Nota[] = [];

  for (const [grados, semitonos] of formula.notas) {
    const nota = desplazar(fundamental, grados, semitonos);
    if (!nota) return null;
    salida.push(nota);
  }

  return salida;
};

/**
 * Las alturas para que suene: la primera nota abajo y las demás subiendo.
 *
 * Se va sumando una octava mientras haga falta para no bajar nunca, que es
 * como se toca una escala o se cierra un acorde.
 */
const alturasSubiendo = (lista: Nota[]) => {
  const salida: number[] = [];
  let anterior = -1;

  for (const nota of lista) {
    let altura = alturaNota(nota);
    while (altura <= anterior) altura += 12;
    salida.push(altura);
    anterior = altura;
  }

  return salida;
};

const alAzar = <T>(lista: T[]) =>
  lista[Math.floor(Math.random() * lista.length)];

/**
 * Baraja de preguntas de un nivel.
 *
 * Primero se hacen TODAS las combinaciones que se pueden escribir y luego se
 * sortea sobre esa lista. Sortear antes y comprobar después obligaba a
 * reintentar, y en los niveles con muchas fundamentales imposibles (el
 * aumentado desde Do# no existe sin doble sostenido) el reintento se comía
 * media ronda.
 */
const barajaDe = (
  nivel: DeletreoNivel,
  count: number,
  pide: string,
  juntas: boolean,
): Pregunta[] => {
  const posibles: { fundamental: Nota; formula: Formula; notas: Nota[] }[] = [];

  nivel.fundamentales.forEach((fundamental) => {
    nivel.formulas.forEach((formula) => {
      const lista = notasDe(fundamental, formula);
      if (lista) posibles.push({ fundamental, formula, notas: lista });
    });
  });

  const preguntas: Pregunta[] = [];

  for (let i = 0; i < count; i++) {
    let elegida = alAzar(posibles);

    // Dos preguntas iguales seguidas cantan mucho; se vuelve a sortear unas
    // cuantas veces y si no hay suerte se deja, que la ronda no se pare por
    // esto.
    for (
      let intento = 0;
      intento < 8 &&
      preguntas.length > 0 &&
      preguntas[preguntas.length - 1].objeto ===
        `${nombreNota(elegida.fundamental)} ${elegida.formula.label}`;
      intento++
    ) {
      elegida = alAzar(posibles);
    }

    preguntas.push({
      pide,
      objeto: `${nombreNota(elegida.fundamental)} ${elegida.formula.label}`,
      notas: elegida.notas,
      sonido: alturasSubiendo(elegida.notas),
      juntas,
    });
  }

  return preguntas;
};

export const escalaQuiz = (nivel: DeletreoNivel, count: number) =>
  barajaDe(nivel, count, "Escala de", false);

export const acordeQuiz = (nivel: DeletreoNivel, count: number) =>
  barajaDe(nivel, count, "Acorde de", true);

/**
 * Preguntas de intervalos: una nota, un intervalo y hacia dónde.
 *
 * No tiene niveles a propósito. Un intervalo es una sola respuesta y la
 * dificultad está en el intervalo, no en cuántos haya: partirlo en niveles
 * sería repartir doce preguntas en cuatro pantallas.
 */
export const intervaloQuiz = (count: number): Pregunta[] => {
  const posibles: {
    raiz: Nota;
    intervalo: Intervalo;
    sube: boolean;
    respuesta: Nota;
  }[] = [];

  FUNDAMENTALES.forEach((raiz) => {
    INTERVALOS.forEach((intervalo) => {
      [true, false].forEach((sube) => {
        const signo = sube ? 1 : -1;
        const respuesta = desplazar(
          raiz,
          signo * intervalo.grados,
          signo * intervalo.semitonos,
        );
        if (respuesta) posibles.push({ raiz, intervalo, sube, respuesta });
      });
    });
  });

  const preguntas: Pregunta[] = [];

  for (let i = 0; i < count; i++) {
    let elegida = alAzar(posibles);

    for (
      let intento = 0;
      intento < 8 &&
      preguntas.length > 0 &&
      preguntas[preguntas.length - 1].objeto === nombreNota(elegida.raiz) &&
      preguntas[preguntas.length - 1].pide.includes(elegida.intervalo.label);
      intento++
    ) {
      elegida = alAzar(posibles);
    }

    const raiz = alturaNota(elegida.raiz);
    const signo = elegida.sube ? 1 : -1;

    preguntas.push({
      pide: `${elegida.sube ? "Sube" : "Baja"} una ${elegida.intervalo.label} desde`,
      objeto: nombreNota(elegida.raiz),
      notas: [elegida.respuesta],
      sonido: [raiz, raiz + signo * elegida.intervalo.semitonos],
      juntas: false,
    });
  }

  return preguntas;
};
