// Niveles de "Intervalos al oído", melódicos y armónicos.
//
// Antes sonaban los trece de golpe desde la primera pregunta, y así de primeras
// no hay por dónde cogerlo. Se empieza por los que se reconocen antes que
// ningún otro —la 3ª mayor y la 5ª— y se va abriendo el abanico.
//
// El nivel se elige en /play/oido, encima de las tarjetas de melódicos y
// armónicos, y llega al juego en la dirección: /play/oido/intervalos?nivel=2.
//
// PARA CAMBIAR UN NIVEL basta con tocar esta lista. Los nombres de `intervals`
// son los de `INTERVALS` en `app/play/oido/audio.ts`, que es lo que pintan los
// botones y lo que se compara al contestar.

export interface EarIntervalLevel {
  /** El número que va en `?nivel=`. */
  id: number;
  label: string;
  /** La línea que sale debajo del selector con el nivel elegido. */
  desc: string;
  /** Los intervalos que pueden sonar, y los únicos botones que se enseñan. */
  intervals: string[];
}

const NIVEL_2 = ["b3", "3", "4", "5", "8va"];

export const EAR_INTERVAL_LEVELS: EarIntervalLevel[] = [
  {
    id: 1,
    label: "Nivel 1",
    desc: "3ª mayor y 5ª justa",
    intervals: ["3", "5"],
  },
  {
    id: 2,
    label: "Nivel 2",
    desc: "3ª menor, 3ª mayor, 4ª justa, 5ª justa y 8ª justa",
    intervals: NIVEL_2,
  },
  {
    id: 3,
    label: "Nivel 3",
    desc: "Lo del nivel 2 más 2ª menor, 2ª mayor, 6ª menor y 6ª mayor",
    intervals: [...NIVEL_2, "b2", "2", "b6", "6"],
  },
  {
    id: 4,
    label: "Nivel 4",
    desc: "Todos hasta la octava, con el tritono y las 7ªs",
    intervals: ["Unísono", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7", "8va"],
  },
];

export const DEFAULT_EAR_LEVEL = EAR_INTERVAL_LEVELS[0];

/**
 * El nivel de un `?nivel=` tal y como llega en la dirección. Si no hay, o no es
 * ninguno de la lista, el nivel 1.
 */
export const earLevelFromParam = (nivel: string | string[] | undefined) => {
  const value = Array.isArray(nivel) ? nivel[0] : nivel;
  return EAR_INTERVAL_LEVELS.find((level) => String(level.id) === value) ?? DEFAULT_EAR_LEVEL;
};

/**
 * Cómo se guarda la partida en el progreso: como si el nivel fuera parte de la
 * ruta ("/play/oido/intervalos/nivel-2"). El progreso saca el nivel de la ruta
 * (ver `gameFromPath`) y el `?nivel=` no lo vería, así que sin esto todas las
 * partidas caerían en el mismo saco y un pleno en el nivel 1 daría el modo
 * por dominado.
 */
export const earLevelPath = (basePath: string, level: EarIntervalLevel) =>
  `${basePath}/nivel-${level.id}`;

/** Los niveles tal y como acaban guardados, para `GAME_LEVELS`. */
export const earLevelSlugs = (screen: string) =>
  EAR_INTERVAL_LEVELS.map((level) => `${screen}/nivel-${level.id}`);

/**
 * Columnas de la botonera según cuántos botones haya. Con dos botones en una
 * rejilla de ocho quedaban apelotonados en una esquina. Las clases van
 * escritas enteras para que Tailwind las encuentre.
 */
export const earButtonGrid = (count: number) =>
  count <= 3
    ? "grid-cols-2 max-w-sm mx-auto"
    : count <= 5
      ? "grid-cols-3 sm:grid-cols-5 max-w-2xl mx-auto"
      : count <= 9
        ? "grid-cols-3 sm:grid-cols-5 md:grid-cols-9"
        : "grid-cols-4 sm:grid-cols-5 md:grid-cols-8";
