/**
 * Los temas del trivial.
 *
 * Cada tema es un NIVEL del modo, igual que en lectura de notas o en piano:
 * tiene su URL (/play/trivia/guitarra), sus partidas se guardan con su
 * `level_slug` y gana su propia medalla.
 *
 * Eso no es un capricho de organización, arregla un problema real: con todas
 * las preguntas en un mismo saco, la medalla del trivial se sacaba haciendo
 * pleno en 24 preguntas cogidas al azar de quinientas. Eso no dice "me sé el
 * trivial", dice "me tocaron 24 fáciles". Por temas hay que bordarlos todos.
 *
 * Este archivo no toca la base de datos a propósito: lo importa el menú, que es
 * un componente de cliente. Las preguntas se piden en `lib/triviaQuestions.ts`.
 */

export interface TriviaTopic {
  /** Lo que va en la URL y en `trivia_questions.tema`. */
  slug: string;
  title: string;
  desc: string;
}

/**
 * El tema que no es un tema.
 *
 * "General" no filtra por `tema`: sortea entre TODAS las preguntas de la tabla,
 * las de guitarra y las de orquesta y las que se escribieron para él. Es el
 * modo de "a ver qué cae", que es como se juega un trivial de verdad, y de paso
 * el único sitio donde puede salir una pregunta de un tema que nadie abre.
 *
 * Va como slug y no como un caso aparte en la URL para que se comporte igual
 * que los demás: tiene su /play/trivia/general, su `level_slug` y su medalla.
 * Lo único distinto es que al pedir las preguntas se manda `null` en vez del
 * slug (ver `lib/triviaQuestions.ts`).
 */
export const TRIVIA_GENERAL = "general";

export const TRIVIA_TOPICS: TriviaTopic[] = [
  {
    slug: TRIVIA_GENERAL,
    title: "General",
    desc: "De todo un poco: sale cualquier pregunta, de cualquier tema.",
  },
  {
    slug: "guitarra",
    title: "Guitarra",
    desc: "Modelos, maderas, pastillas, puentes y quién tocaba qué.",
  },
  {
    slug: "amplificacion",
    title: "Amplificación",
    desc: "Válvulas, altavoces, pantallas y pedales.",
  },
  {
    slug: "teclados",
    title: "Teclados y sintetizadores",
    desc: "Del martillo del piano al Minimoog.",
  },
  {
    slug: "instrumentos",
    title: "Instrumentos",
    desc: "Familias, registros y cómo suena cada cosa.",
  },
  {
    slug: "orquesta",
    title: "Orquesta",
    desc: "Quién se sienta dónde y quién toca qué.",
  },
  {
    slug: "grabacion",
    title: "Grabación y tecnología",
    desc: "Micrófonos, estudio, mezcla y formatos.",
  },
  {
    slug: "lenguaje",
    title: "Lenguaje musical",
    desc: "Intervalos, armaduras, compases y armonía.",
  },
  {
    slug: "historia",
    title: "Historia y grupos",
    desc: "Discos, bandas y las historias de siempre.",
  },
  {
    slug: "generos",
    title: "Géneros",
    desc: "De dónde sale cada estilo y en qué se le reconoce.",
  },
  {
    slug: "espana",
    title: "España",
    desc: "Lo de aquí: grupos, discos y una escena entera.",
  },
];

export const findTriviaTopic = (slug: string) =>
  TRIVIA_TOPICS.find((topic) => topic.slug === slug);

/** Una pregunta tal y como la recibe la pantalla, con las opciones ya barajadas. */
export interface TriviaQuestion {
  pregunta: string;
  opciones: string[];
  respuesta: string;
}
