// Catálogo único de modos de juego: lo usan el menú, las medallas y el perfil.
//
// IMPORTANTE: `name` es la clave que se guarda en la base de datos
// (game_attempts.game_name, student_medals.game_name). NO se puede cambiar sin
// migrar los datos. Lo que se ve en pantalla es `label`, que sí es libre.

export type GameIcon =
  | "Hash"
  | "Waypoints"
  | "ArrowUpDown"
  | "Drum"
  | "Guitar"
  | "Grip"
  | "Ear"
  | "Layers"
  | "Lightbulb"
  | "Music2"
  | "BookOpen";

export type CategoryId = "lenguaje" | "diapason" | "oido" | "cultura" | "herramientas";

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
 * Tres tonos saturados (ámbar, cian, violeta), uno cálido de apoyo (rosa) y
 * uno neutro para lo que no es juego. Antes había un color por modo y el menú
 * parecía un arcoíris; el color ahora dice a qué familia pertenece cada cosa.
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
    id: "diapason",
    label: "Diapasón",
    hint: "Encontrarlo en el mástil",
    accent: "text-sky-300",
    iconBg: "bg-sky-400/15",
    hoverBorder: "hover:border-sky-300/50",
    dot: "bg-sky-400",
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
    id: "cultura",
    label: "Cultura",
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
  /** true si el juego puntúa y por tanto puede dar medalla */
  scored: boolean;
}

export const GAMES: GameMode[] = [
  // --- Lenguaje musical ------------------------------------------------
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

  // --- Diapasón --------------------------------------------------------
  {
    name: "Diapasón",
    label: "Notas en el mástil",
    desc: "Encuentra cualquier nota sin pensarla.",
    slug: "/play/diapason",
    icon: "Guitar",
    category: "diapason",
    scored: true,
  },
  {
    name: "Acordes",
    label: "Acordes en el mástil",
    desc: "Tríadas y séptimas por su forma.",
    slug: "/play/diapason_acordes",
    icon: "Grip",
    category: "diapason",
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
    desc: "Del I-IV-V a las cuatríadas, por niveles.",
    slug: "/play/oido/acordes",
    icon: "Layers",
    category: "oido",
    scored: true,
  },

  // --- Cultura ---------------------------------------------------------
  {
    name: "Trivial",
    label: "Trivial",
    desc: "Guitarra, discos y artistas.",
    slug: "/play/trivia",
    icon: "Lightbulb",
    category: "cultura",
    scored: true,
  },

  // --- Herramientas ----------------------------------------------------
  {
    name: "Constructor de melodías",
    label: "Constructor de melodías",
    desc: "Escribe, escucha y transporta tus propias frases.",
    slug: "/play/constructor-melodias",
    icon: "Music2",
    category: "herramientas",
    scored: false,
  },
  {
    name: "Ej. Rockschool",
    label: "Ej. Rockschool",
    desc: "Los ejercicios del método, con pentagrama y audio.",
    slug: "/play/rockschool",
    icon: "BookOpen",
    category: "herramientas",
    scored: false,
  },
];

/** Juegos que puntúan: los únicos que pueden dar medalla. */
export const SCORED_GAMES = GAMES.filter((game) => game.scored);

export const findGame = (name: string) => GAMES.find((game) => game.name === name);

export const isKnownGame = (name: string) =>
  GAMES.some((game) => game.name === name && game.scored);

/** Nombre visible de un juego a partir de su clave en base de datos. */
export const gameLabel = (name: string) => findGame(name)?.label ?? name;

export const categoryOf = (id: CategoryId) =>
  CATEGORIES.find((category) => category.id === id)!;

/** Los juegos de cada categoría, en el orden del catálogo. */
export const gamesByCategory = () =>
  CATEGORIES.map((category) => ({
    category,
    games: GAMES.filter((game) => game.category === category.id),
  })).filter((group) => group.games.length > 0);
