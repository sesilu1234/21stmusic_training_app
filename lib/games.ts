// Catálogo único de modos de juego: lo usan el menú y la página "Sobre la app".
//
// IMPORTANTE: `name` es la clave con la que se guardaron las partidas en la
// base de datos (game_attempts.game_name, student_medals.game_name). NO se
// puede cambiar sin migrar esos datos. En pantalla se enseña `label`.

export type GameIcon =
  | "Hash"
  | "Waypoints"
  | "ArrowUpDown"
  | "Drum"
  | "Guitar"
  | "Grip"
  | "Ear"
  | "Layers"
  | "ListMusic"
  | "Piano"
  | "Lightbulb"
  | "Music2"
  | "Mic"
  | "BookOpen";

export type CategoryId =
  | "lenguaje"
  | "oido"
  | "guitarra"
  | "piano"
  | "extras"
  | "herramientas";

export interface Category {
  id: CategoryId;
  label: string;
  hint: string;
  /** Clases tailwind fijas: no interpolar, Tailwind necesita el string entero. */
  accent: string;
  iconBg: string;
  hoverBorder: string;
  dot: string;
}

/**
 * Un color por familia. Antes había un color por modo y el menú parecía un
 * arcoíris; ahora el color dice a qué categoría pertenece cada cosa.
 *
 * El orden de este array es el orden en que salen las secciones del menú.
 */
export const CATEGORIES: Category[] = [
  {
    id: "lenguaje",
    label: "Lenguaje musical",
    hint: "Lo que se lee y se escribe",
    accent: "text-amber-300",
    iconBg: "bg-amber-400/15",
    hoverBorder: "hover:border-amber-300/50",
    dot: "bg-amber-400",
  },
  {
    id: "oido",
    label: "Oído",
    hint: "Reconocerlo sin verlo",
    accent: "text-violet-300",
    iconBg: "bg-violet-400/15",
    hoverBorder: "hover:border-violet-300/50",
    dot: "bg-violet-400",
  },
  {
    id: "guitarra",
    label: "Guitarra",
    hint: "Encontrarlo en el mástil",
    accent: "text-sky-300",
    iconBg: "bg-sky-400/15",
    hoverBorder: "hover:border-sky-300/50",
    dot: "bg-sky-400",
  },
  {
    id: "piano",
    label: "Piano",
    hint: "Encontrarlo en el teclado",
    accent: "text-emerald-300",
    iconBg: "bg-emerald-400/15",
    hoverBorder: "hover:border-emerald-300/50",
    dot: "bg-emerald-400",
  },
  {
    id: "extras",
    label: "Extras",
    hint: "Lo que rodea a la música",
    accent: "text-rose-300",
    iconBg: "bg-rose-400/15",
    hoverBorder: "hover:border-rose-300/50",
    dot: "bg-rose-400",
  },
  {
    id: "herramientas",
    label: "Herramientas",
    hint: "No puntúan: son para trastear",
    accent: "text-slate-300",
    iconBg: "bg-white/10",
    hoverBorder: "hover:border-white/30",
    dot: "bg-slate-400",
  },
];

export interface GameMode {
  /** Clave en base de datos. NO cambiar. */
  name: string;
  /** Nombre visible. Libre. */
  label: string;
  desc: string;
  slug: string;
  icon: GameIcon;
  category: CategoryId;
  /** true si el juego lleva marcador de aciertos al terminar */
  scored: boolean;
  /**
   * true = solo para alumnos con cuenta. La tarjeta sale apagada y con candado
   * en el menú, y entrar por URL enseña el aviso de "solo para alumnos".
   * Para abrir o cerrar un modo basta con tocar esta línea.
   */
  studentsOnly?: boolean;
  /**
   * true = idea apuntada, todavía sin construir. La tarjeta se enseña apagada
   * y sin enlace, para que la categoría exista en el menú desde el principio.
   * Al construir el modo se borra esta línea y ya está.
   */
  comingSoon?: boolean;
}

export const GAMES: GameMode[] = [
  // --- Lenguaje musical ------------------------------------------------
  {
    name: "Lectura de notas",
    label: "Lectura de notas",
    desc: "Sale una nota en el pentagrama y dices cuál es.",
    slug: "/play/lectura-notas",
    icon: "Music2",
    category: "lenguaje",
    scored: true,
  },
  {
    name: "Acordes en el pentagrama",
    label: "Acordes en el pentagrama",
    desc: "Léelos del papel y escríbelos nota a nota.",
    slug: "/play/acordes-pentagrama",
    icon: "Layers",
    category: "lenguaje",
    scored: true,
  },
  {
    name: "Armaduras",
    label: "Armaduras",
    desc: "Tonalidades y alteraciones al vuelo.",
    slug: "/play/armadura",
    icon: "Hash",
    category: "lenguaje",
    scored: true,
  },
  {
    name: "Intervalos",
    label: "Intervalos",
    desc: "La distancia entre dos notas.",
    slug: "/play/intervalos",
    icon: "ArrowUpDown",
    category: "lenguaje",
    scored: true,
  },
  {
    name: "Modos E. Mayor",
    label: "Modos griegos",
    desc: "Reconoce cada modo en el pentagrama.",
    slug: "/play/modos",
    icon: "Waypoints",
    category: "lenguaje",
    scored: true,
    studentsOnly: true,
  },
  {
    name: "Lectura Rítmica",
    label: "Lectura rítmica",
    desc: "Pulsa al ritmo exacto de la partitura.",
    slug: "/play/ritmo",
    icon: "Drum",
    category: "lenguaje",
    scored: true,
  },

  // --- Oído ------------------------------------------------------------
  {
    name: "Oído",
    label: "Intervalos al oído",
    desc: "Melódicos y armónicos, de la b2 a la 8ª.",
    slug: "/play/oido",
    icon: "Ear",
    category: "oido",
    scored: true,
  },
  {
    name: "Acordes al oído",
    label: "Acordes al oído",
    desc: "Suena un acorde suelto: di de qué tipo es.",
    slug: "/play/oido/acordes",
    icon: "Layers",
    category: "oido",
    scored: true,
  },
  {
    name: "Progresiones al oído",
    label: "Progresiones al oído",
    desc: "Suena una rueda de acordes: di qué grados son.",
    slug: "/play/oido/progresiones",
    icon: "ListMusic",
    category: "oido",
    scored: true,
    studentsOnly: true,
  },

  {
    name: "Modos al oído",
    label: "Modos al oído",
    desc: "Un pedal debajo y la escala encima: di qué modo griego es.",
    slug: "/play/oido/modos",
    icon: "Waypoints",
    category: "oido",
    scored: true,
    studentsOnly: true,
  },
  {
    name: "Dictado melódico",
    label: "Dictado melódico",
    desc: "Suena una melodía corta y la sacas en el piano.",
    slug: "/play/oido/dictado",
    icon: "Music2",
    category: "oido",
    scored: true,
  },

  // --- Guitarra --------------------------------------------------------
  {
    name: "Diapasón",
    label: "Notas en el mástil",
    desc: "Encuentra cualquier nota sin pensarla.",
    slug: "/play/diapason",
    icon: "Guitar",
    category: "guitarra",
    scored: true,
  },
  {
    name: "Acordes",
    label: "Acordes en el mástil",
    desc: "Tríadas y séptimas por su forma.",
    slug: "/play/diapason_acordes",
    icon: "Grip",
    category: "guitarra",
    scored: true,
  },

  // --- Piano -----------------------------------------------------------
  {
    name: "Piano: notas en el teclado",
    label: "Notas en el teclado",
    desc: "Sale una nota en el pentagrama y la tocas en el piano.",
    slug: "/play/piano/notas",
    icon: "Piano",
    category: "piano",
    scored: true,
  },
  {
    name: "Piano: tocar el intervalo",
    label: "Toca el intervalo",
    desc: "«Desde Mi, toca la 5ª»: encuentra la tecla que toca.",
    slug: "/play/piano/intervalos",
    icon: "ArrowUpDown",
    category: "piano",
    scored: true,
  },
  {
    name: "Piano: reconocer el intervalo",
    label: "Reconoce el intervalo",
    desc: "Se iluminan dos teclas: di qué distancia hay entre ellas.",
    slug: "/play/piano/reconocer-intervalos",
    icon: "Ear",
    category: "piano",
    scored: true,
  },
  {
    name: "Piano: construir acordes",
    label: "Construye acordes",
    desc: "Sale el nombre de un acorde y lo montas tecla a tecla.",
    slug: "/play/piano/acordes",
    icon: "Layers",
    category: "piano",
    scored: true,
  },
  {
    name: "Piano: construir escalas",
    label: "Construye escalas",
    desc: "Sale el nombre de una escala y la tocas entera.",
    slug: "/play/piano/escalas",
    icon: "Waypoints",
    category: "piano",
    scored: true,
  },

  // --- Extras ----------------------------------------------------------
  {
    name: "Trivial",
    label: "Trivial",
    desc: "Guitarra, discos y artistas.",
    slug: "/play/trivia",
    icon: "Lightbulb",
    category: "extras",
    scored: true,
  },

  // --- Herramientas ----------------------------------------------------
  {
    name: "Piano libre",
    label: "Piano libre",
    desc: "Un piano y ya. Se toca con el ratón o con el teclado.",
    slug: "/play/piano-libre",
    icon: "Piano",
    category: "herramientas",
    scored: false,
  },
  {
    name: "Vocalizaciones",
    label: "Vocalizaciones",
    desc: "Calentar y entrenar la voz: escalas y acordes que suben y bajan.",
    slug: "/play/vocalizaciones",
    icon: "Mic",
    category: "herramientas",
    scored: false,
  },
  {
    name: "Ej. Rockschool",
    label: "Rockschool",
    desc: "Los ejercicios del método para cantarlos, grado a grado.",
    slug: "/play/rockschool",
    icon: "BookOpen",
    category: "herramientas",
    scored: false,
    studentsOnly: true,
  },
];

/**
 * Niveles cerrados DENTRO de un modo que está abierto.
 *
 * `studentsOnly` en el catálogo cierra un modo entero; esto es para cuando el
 * modo se puede probar sin cuenta pero sus niveles avanzados no. La clave es
 * el slug del modo y hay dos maneras de decirlo, cada modo usa la que le
 * cuadre:
 *
 *  - `cerrados`: estos piden cuenta y el resto están abiertos. Para cuando lo
 *    cerrado es la excepción.
 *  - `soloAbiertos`: solo estos están abiertos y TODO lo demás pide cuenta,
 *    incluido lo que se añada mañana. Para cuando lo que se enseña sin cuenta
 *    es una muestra.
 *
 * Para abrir o cerrar un nivel basta con tocar este bloque: la puerta
 * (`LevelGate`) y el candado de los menús salen los dos de aquí.
 */
export const LEVEL_ACCESS: Record<
  string,
  { cerrados?: string[]; soloAbiertos?: string[] }
> = {
  // De ritmo se prueba el primer módulo y ya. Va con `soloAbiertos` a
  // propósito: si algún día hay un módulo 7, nace cerrado.
  "/play/ritmo": { soloAbiertos: ["modulo1"] },
  "/play/oido/acordes": { cerrados: ["dos-acordes"] },
  "/play/oido/dictado": { cerrados: ["cinco"] },
};

/** ¿Este nivel de este modo pide cuenta? */
export const isStudentsOnlyLevel = (gameSlug: string, levelSlug: string) => {
  const access = LEVEL_ACCESS[gameSlug];
  if (!access) return false;
  if (access.soloAbiertos) return !access.soloAbiertos.includes(levelSlug);
  return access.cerrados?.includes(levelSlug) ?? false;
};

export const categoryOf = (id: CategoryId) =>
  CATEGORIES.find((category) => category.id === id)!;

/** Los juegos de cada categoría, en el orden del catálogo. */
export const gamesByCategory = () =>
  CATEGORIES.map((category) => ({
    category,
    games: GAMES.filter((game) => game.category === category.id),
  })).filter((group) => group.games.length > 0);

/**
 * De qué modo es una ruta, y en qué nivel.
 *
 * Se busca por prefijo y gana el más largo: /play/oido/acordes es su propio
 * modo, no una pantalla de /play/oido. Lo que sobra de la ruta es el nivel
 * ("sol-naturales", "nombrar/triadas"), que es lo que distingue una partida de
 * otra dentro del mismo modo.
 */
export const gameFromPath = (pathname: string) => {
  const game = GAMES.filter(
    (item) => pathname === item.slug || pathname.startsWith(`${item.slug}/`),
  ).sort((a, b) => b.slug.length - a.slug.length)[0];

  if (!game) return null;

  const rest = pathname.slice(game.slug.length).replace(/^\/+|\/+$/g, "");
  return { game, levelSlug: rest || null };
};

/**
 * ¿Esta ruta es de un modo restringido? Se compara por prefijo porque los
 * modos con submenú viven en rutas hijas (/play/oido/progresiones/i-iv-v).
 */
export const isStudentsOnlyPath = (pathname: string) =>
  GAMES.some(
    (game) =>
      game.studentsOnly &&
      (pathname === game.slug || pathname.startsWith(`${game.slug}/`)),
  );
