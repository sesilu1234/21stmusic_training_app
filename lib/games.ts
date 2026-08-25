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
    studentsOnly: true,
  },
];

export const categoryOf = (id: CategoryId) =>
  CATEGORIES.find((category) => category.id === id)!;

/** Los juegos de cada categoría, en el orden del catálogo. */
export const gamesByCategory = () =>
  CATEGORIES.map((category) => ({
    category,
    games: GAMES.filter((game) => game.category === category.id),
  })).filter((group) => group.games.length > 0);

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
