// Catálogo único de modos de juego: lo usan el menú, las medallas y el ranking.
// `name` es lo que se guarda en la base de datos (game_attempts.game_name).

export type GameIcon =
  | "Hash"
  | "Target"
  | "Headphones"
  | "Music2"
  | "Activity"
  | "Music"
  | "Ear";

export interface GameMode {
  name: string;
  desc: string;
  slug: string;
  icon: GameIcon;
  /** clases tailwind fijas (no interpolar, Tailwind necesita el string entero) */
  bg: string;
  accent: string;
  /** true si el juego puntúa y por tanto puede dar medalla */
  scored: boolean;
}

export const GAMES: GameMode[] = [
  {
    name: "Armaduras",
    desc: "Identifica tonalidades y alteraciones.",
    slug: "/play/armadura",
    icon: "Hash",
    bg: "bg-amber-500/20",
    accent: "text-amber-400",
    scored: true,
  },
  {
    name: "Diapasón",
    desc: "Ubica notas en el mástil rápidamente.",
    slug: "/play/diapason",
    icon: "Target",
    bg: "bg-sky-500/20",
    accent: "text-sky-400",
    scored: true,
  },
  {
    name: "Acordes",
    desc: "Reconoce la estructura de los acordes.",
    slug: "/play/diapason_acordes",
    icon: "Headphones",
    bg: "bg-emerald-500/20",
    accent: "text-emerald-400",
    scored: true,
  },
  {
    name: "Modos E. Mayor",
    desc: "Identifica escalas y modos en el pentagrama.",
    slug: "/play/modos",
    icon: "Music2",
    bg: "bg-indigo-500/20",
    accent: "text-indigo-400",
    scored: true,
  },
  {
    name: "Intervalos",
    desc: "Mide la distancia entre dos notas.",
    slug: "/play/intervalos",
    icon: "Activity",
    bg: "bg-fuchsia-500/20",
    accent: "text-fuchsia-400",
    scored: true,
  },
  {
    name: "Trivial",
    desc: "Cultura general de guitarra y artistas.",
    slug: "/play/trivia",
    icon: "Music",
    bg: "bg-red-500/20",
    accent: "text-red-400",
    scored: true,
  },
  {
    name: "Lectura Rítmica",
    desc: "Pulsa al ritmo exacto de la partitura.",
    slug: "/play/ritmo",
    icon: "Activity",
    bg: "bg-orange-500/20",
    accent: "text-orange-400",
    scored: true,
  },
  {
    name: "Oído",
    desc: "Intervalos melódicos, armónicos y dobles díadas.",
    slug: "/play/oido",
    icon: "Ear",
    bg: "bg-violet-500/20",
    accent: "text-violet-400",
    scored: true,
  },
  {
    name: "Ej. Canto / Melodías",
    desc: "Constructor de melodías y ejercicios Rockschool.",
    slug: "/play/melodias",
    icon: "Music2",
    bg: "bg-teal-500/20",
    accent: "text-teal-400",
    scored: false,
  },
];

/** Juegos que puntúan: los únicos que pueden dar medalla. */
export const SCORED_GAMES = GAMES.filter((game) => game.scored);

export const findGame = (name: string) =>
  GAMES.find((game) => game.name === name);

export const isKnownGame = (name: string) =>
  GAMES.some((game) => game.name === name && game.scored);
