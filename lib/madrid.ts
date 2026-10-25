// Fechas en hora de Madrid, que es la de la escuela.
//
// El reto diario cambia a medianoche de Madrid, no a la del servidor (Vercel
// va en UTC) ni a la del navegador de cada uno. Sirve en los dos lados.

const TIME_ZONE = "Europe/Madrid";

/** El día natural de una fecha, en Madrid: "2026-10-24". */
export const madridDay = (date: Date = new Date()) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: TIME_ZONE }).format(date);

/** La hora de Madrid de un instante, de 0 a 23. */
const madridHour = (date: Date) =>
  Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );

/** Segundos que lleva el día en Madrid. */
const madridSecondsIntoDay = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return get("hour") * 3600 + get("minute") * 60 + get("second");
};

/**
 * El instante de la próxima medianoche en Madrid.
 *
 * Se calcula con lo que queda de día, y luego se corrige una hora arriba o
 * abajo si en medio hay cambio de hora (las dos noches del año en que el día
 * dura 23 o 25 horas).
 */
export const nextMadridMidnight = (now: Date = new Date()) => {
  const left = 24 * 3600 - madridSecondsIntoDay(now);
  let guess = new Date(Math.floor(now.getTime() / 1000) * 1000 + left * 1000);
  const hour = madridHour(guess);
  if (hour === 23) guess = new Date(guess.getTime() + 3600 * 1000);
  else if (hour === 1) guess = new Date(guess.getTime() - 3600 * 1000);
  return guess;
};

/** Días enteros de `from` a `to`, los dos como "2026-10-24". */
export const daysBetween = (from: string, to: string) => {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
};
