// Qué intervalos suenan en "Intervalos al oído", melódicos y armónicos.
//
// Lo normal son todos, hasta la octava, y es lo único que cuenta para el
// progreso y la medalla. Además se pueden elegir a mano los que se quieran
// practicar: eso es práctica y no se guarda. Si contara, cada uno se haría su
// propio ejercicio con dos intervalos fáciles y las medallas no dirían nada.
//
// Hasta octubre de 2026 había cuatro niveles fijos; se quitaron porque elegir
// a mano ya cubre lo mismo y deja más libertad (db/oido_sin_niveles.sql).
//
// La selección se hace en /play/oido, encima de las tarjetas, y llega al juego
// en la dirección: /play/oido/intervalos?iv=3,5,b7. Sin `?iv=`, todos.
//
// Los nombres son los de `INTERVALS` en `app/play/oido/audio.ts`, que es lo
// que pintan los botones y lo que se compara al contestar.

export interface EarIntervalSet {
  /** Los intervalos que pueden sonar, y los únicos botones que se enseñan. */
  intervals: string[];
  /** true = elegidos a mano, y por tanto práctica: no se guarda. */
  custom: boolean;
}

/** Todos, en orden. */
export const ALL_EAR_INTERVALS = [
  "Unísono", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7", "8va",
];

/** Lo normal: todos. Es lo que cuenta. */
export const FULL_EAR_SET: EarIntervalSet = { intervals: ALL_EAR_INTERVALS, custom: false };

/**
 * Cuántos hay que elegir como mínimo, sin contar el unísono: en armónicos el
 * unísono no se pregunta (dos notas iguales a la vez son una), y con uno solo
 * no habría nada que distinguir.
 */
export const MIN_CUSTOM_INTERVALS = 2;

/** Lo que se dice al acabar una partida con intervalos elegidos a mano. */
export const PRACTICE_NOTE =
  "Práctica: con intervalos elegidos a mano no cuenta para el progreso ni la medalla.";

/**
 * Una selección a mano. Los nombres que no existen se descartan; si no llegan
 * al mínimo, null. Si están todos, es lo normal y cuenta.
 */
export const earIntervalSet = (intervals: string[]): EarIntervalSet | null => {
  const picked = ALL_EAR_INTERVALS.filter((name) => intervals.includes(name));
  if (picked.filter((name) => name !== "Unísono").length < MIN_CUSTOM_INTERVALS) return null;
  if (picked.length === ALL_EAR_INTERVALS.length) return FULL_EAR_SET;
  return { intervals: picked, custom: true };
};

/** La selección de la dirección (`?iv=3,5,b7`). Si no hay, o no vale, todos. */
export const earSetFromParam = (iv: string | string[] | undefined) => {
  const value = Array.isArray(iv) ? iv[0] : iv;
  return (value && earIntervalSet(value.split(","))) || FULL_EAR_SET;
};

/** Lo que va detrás del `?` en el enlace a un juego. Vacío si son todos. */
export const earSetQuery = (set: EarIntervalSet) =>
  set.custom ? `?iv=${encodeURIComponent(set.intervals.join(","))}` : "";

/** Para el `key` de la partida: otra selección es una partida nueva. */
export const earSetKey = (set: EarIntervalSet) => set.intervals.join(",");

/**
 * Columnas de la botonera según cuántos botones haya, para que pocos quepan en
 * una sola fila y muchos se repartan en filas llenas. Antes iba por tramos, y
 * tres botones salían en dos filas (dos y uno) cuando cabían en una. Las clases
 * van escritas enteras para que Tailwind las encuentre.
 */
const BUTTON_GRIDS: Record<number, string> = {
  2: "grid-cols-2 max-w-xs mx-auto",
  3: "grid-cols-3 max-w-sm mx-auto",
  4: "grid-cols-4 max-w-md mx-auto",
  5: "grid-cols-5 max-w-2xl mx-auto",
  6: "grid-cols-3 sm:grid-cols-6 max-w-3xl mx-auto",
  7: "grid-cols-4 sm:grid-cols-7",
  8: "grid-cols-4 sm:grid-cols-8",
  9: "grid-cols-3 sm:grid-cols-5 md:grid-cols-9",
  10: "grid-cols-5 md:grid-cols-10",
  11: "grid-cols-4 sm:grid-cols-6 md:grid-cols-11",
  12: "grid-cols-4 sm:grid-cols-6 md:grid-cols-12",
};

export const earButtonGrid = (count: number) =>
  BUTTON_GRIDS[count] ?? "grid-cols-4 sm:grid-cols-5 md:grid-cols-8";
