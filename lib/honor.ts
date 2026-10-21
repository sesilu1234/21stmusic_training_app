// El cuadro de honor: quién va arriba entre los alumnos que han pedido salir.
//
// Nada de esto se guarda. Sale del mismo `getProgress` que el panel de cada
// alumno, así que las cifras del cuadro son exactamente las que cada uno ve en
// su progreso: si no cuadraran, alguien lo notaría enseguida.
//
// Es una clasificación tipo liga: una tabla por periodo (semana / desde
// siempre) y por familia (todo, lenguaje, oído, guitarra, piano), ordenable
// por medallas, días o racha. Por familia y no por modo: con una escuela
// pequeña, un ranking por modo tendría una o dos personas, y un alumno de
// piano no tiene por qué competir en el mástil de guitarra.
//
// Reglas, por lo que tiene de delicado enseñar a unos alumnos lo de otros:
//
//   · Solo sale quien lo ha pedido (`show_in_honor`, db/honor.sql). Quien no,
//     ni sale ni ocupa puesto.
//   · Solo podios: los cinco primeros de cada tabla. Nadie aparece el último.
//     Las tablas se calculan aquí ya recortadas: lo que no se enseña tampoco
//     viaja al navegador.
//   · Nombre e inicial ("Ana G."), nunca el correo ni el nombre entero.
//   · Una cifra a cero no es un puesto: no se enseña.
//
// De servidor, como lib/progress.ts.

import type { CategoryId } from "./games";
import {
  dayKey,
  getProgress,
  type GameProgress,
  type Progress,
} from "./progress";
import { listHonorStudents } from "./students";

/** Cuántos salen en cada tabla. */
const PODIUM = 5;

/**
 * Por debajo de esto el cuadro no se enseña: con un solo apuntado sería una
 * tabla con tu nombre y nada más.
 */
export const HONOR_MIN_PARTICIPANTS = 1;

/**
 * Cuánto tiempo se reutiliza el cuadro ya calculado.
 *
 * Calcularlo es pedir el progreso de cada alumno que sale, y la portada lo
 * enseña en cada visita. Cinco minutos de retraso en un ranking no los nota
 * nadie; cuarenta consultas por cada vez que alguien abre la portada, sí.
 * Cuando un alumno se apunta o se borra, se tira y se rehace al momento.
 */
const CACHE_MS = 5 * 60 * 1000;

/** "Ana García López" → "Ana G.". Un nombre solo se queda como está. */
export const honorName = (displayName: string) => {
  const [first = "", second = ""] = displayName.trim().split(/\s+/);
  const nice = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
  return second
    ? `${nice(first)} ${second.charAt(0).toUpperCase()}.`
    : nice(first);
};

export type HonorScope = "semana" | "siempre";
export type HonorSort = "medallas" | "dias" | "racha";
export type HonorFamily =
  | "todo"
  | Extract<CategoryId, "lenguaje" | "oido" | "guitarra" | "piano">;

/** Las pestañas de familia, en orden. "todo" incluye también los extras. */
export const HONOR_FAMILIES: HonorFamily[] = [
  "todo",
  "lenguaje",
  "oido",
  "guitarra",
  "piano",
];
export const HONOR_SORTS: HonorSort[] = ["medallas", "dias", "racha"];

export interface HonorRow {
  /** El puesto en la columna por la que se ordena. Empates, mismo puesto (1, 1, 3…). */
  rank: number;
  name: string;
  medals: number;
  days: number;
  streak: number;
  /** Es quien está mirando. */
  isMe: boolean;
}

export interface HonorMe {
  /** Tu fila. `rank` es 0 si en esta columna estás a cero (sin puesto). */
  row: HonorRow;
  /** true si sales en el cuadro; si no, el puesto es el que tendrías. */
  listed: boolean;
  /** Quien va justo delante y cuánto te falta para alcanzarle. */
  ahead: { name: string | null; rank: number; gap: number } | null;
  /** Quien va justo detrás y cuánto le sacas, si vas primero. */
  behind: { name: string; gap: number } | null;
}

export interface HonorTable {
  /** Los cinco primeros por la columna elegida. */
  rows: HonorRow[];
  /** Tu sitio en esta tabla. null si no hay forma de calcularlo. */
  me: HonorMe | null;
}

export type HonorTables = Record<
  HonorScope,
  Record<HonorFamily, Record<HonorSort, HonorTable>>
>;

export interface HonorBoard {
  tables: HonorTables;
  /** Cuántos alumnos han pedido salir. */
  participants: number;
  /** La semana que se cuenta: los últimos siete días, hoy incluido ("2026-10-10"). */
  weekFrom: string;
  weekTo: string;
}

interface Contender {
  email: string;
  name: string;
  progress: Progress;
}

let cache: { at: number; contenders: Contender[] } | null = null;

/** Tira el cuadro guardado: lo llama quien se apunta o se borra. */
export const forgetHonorBoard = () => {
  cache = null;
};

const loadContenders = async (): Promise<Contender[]> => {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.contenders;

  const students = await listHonorStudents();
  const results = await Promise.all(
    students.map(async (student) => {
      // Si falla uno, ese no sale; el cuadro de los demás sigue.
      const progress = await getProgress(student.email).catch(() => null);
      return progress
        ? {
            email: student.email,
            name: honorName(student.displayName),
            progress,
          }
        : null;
    }),
  );

  const contenders = results.filter(
    (entry): entry is Contender => entry !== null,
  );
  cache = { at: Date.now(), contenders };
  return contenders;
};

/** Los últimos siete días, hoy incluido: la misma ventana que lib/progress.ts. */
const weekKeys = () =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return dayKey(date);
  });

/**
 * Las tres cifras de un alumno en una tabla, o null si en esa tabla no pinta
 * nada (no ha tocado esa familia en ese periodo).
 *
 * Las medallas son de la familia. Los días y la racha son de todo: no se
 * guarda a qué familia se jugó cada día, y "ha practicado" es practicar, sea
 * lo que sea. Por eso la familia decide quién entra en la tabla, y las medallas
 * de esa familia, quién va arriba.
 */
const statsOf = (
  progress: Progress,
  scope: HonorScope,
  family: HonorFamily,
  week: Set<string>,
) => {
  const games =
    family === "todo"
      ? progress.games
      : progress.games.filter((entry) => entry.game.category === family);
  const playedInWeek = (entry: GameProgress) =>
    !!entry.lastPlayedAt && week.has(dayKey(new Date(entry.lastPlayedAt)));

  const takesPart =
    scope === "semana"
      ? games.some((entry) => playedInWeek(entry) || entry.weekMedals > 0)
      : games.some((entry) => entry.attempts > 0);
  if (!takesPart) return null;

  return scope === "semana"
    ? {
        medals: games.reduce((sum, entry) => sum + entry.weekMedals, 0),
        days: progress.weekDays,
        streak: progress.streak.current,
      }
    : {
        medals: games.reduce((sum, entry) => sum + entry.medals, 0),
        days: progress.streak.days.length,
        streak: progress.streak.best,
      };
};

const valueOf = (
  row: Pick<HonorRow, "medals" | "days" | "streak">,
  sort: HonorSort,
) =>
  sort === "medallas" ? row.medals : sort === "dias" ? row.days : row.streak;

/**
 * El cuadro, visto por un alumno. `viewerEmail` solo sirve para marcar su
 * fila: el correo de nadie sale de aquí.
 *
 * `viewerProgress` es para quien NO sale en el cuadro: con él se le dice qué
 * puesto tendría, sin meterle en la tabla. Si no se pasa, a ese alumno
 * simplemente no se le calcula.
 */
export const getHonorBoard = async (
  viewerEmail: string | null,
  viewerProgress: Progress | null = null,
): Promise<HonorBoard> => {
  const contenders = await loadContenders();
  const keys = weekKeys();
  const week = new Set(keys);

  const listed = contenders.some(
    (contender) => contender.email === viewerEmail,
  );
  const outsider = !listed && viewerProgress ? viewerProgress : null;

  const build = (
    scope: HonorScope,
    family: HonorFamily,
    sort: HonorSort,
  ): HonorTable => {
    const ranked = contenders
      .flatMap((contender) => {
        const stats = statsOf(contender.progress, scope, family, week);
        return stats
          ? [
              {
                ...stats,
                name: contender.name,
                isMe: contender.email === viewerEmail,
              },
            ]
          : [];
      })
      .filter((entry) => valueOf(entry, sort) > 0)
      .sort(
        (a, b) =>
          valueOf(b, sort) - valueOf(a, sort) ||
          // A igualdad, desempatan las otras dos columnas, y luego el nombre.
          HONOR_SORTS.filter((key) => key !== sort).reduce(
            (diff, key) => diff || valueOf(b, key) - valueOf(a, key),
            0,
          ) ||
          a.name.localeCompare(b.name, "es"),
      );

    // Puestos compartidos: con la misma cifra, el mismo puesto.
    const withRank: HonorRow[] = [];
    ranked.forEach((entry, index) => {
      const previous = withRank[index - 1];
      const tied = previous && valueOf(previous, sort) === valueOf(entry, sort);
      withRank.push({ ...entry, rank: tied ? previous.rank : index + 1 });
    });

    const rows = withRank.filter((row) => row.rank <= PODIUM);

    const placeOf = (row: HonorRow, isListed: boolean): HonorMe => {
      const mine = valueOf(row, sort);
      const others = withRank.filter((other) => !other.isMe);
      const above = others.filter((other) => valueOf(other, sort) > mine);
      const rank = mine > 0 ? above.length + 1 : 0;
      // El de delante es el último de los que van por encima. Solo se le
      // nombra si sale en el podio: fuera de los cinco nadie tiene nombre.
      const next = above[above.length - 1];
      const after = others.find((other) => valueOf(other, sort) < mine);
      return {
        row: { ...row, rank },
        listed: isListed,
        ahead: next
          ? {
              name: next.rank <= PODIUM ? next.name : null,
              rank: next.rank,
              gap: valueOf(next, sort) - mine,
            }
          : null,
        behind:
          rank === 1 && after && after.rank <= PODIUM
            ? { name: after.name, gap: mine - valueOf(after, sort) }
            : null,
      };
    };

    let me: HonorMe | null = null;
    if (listed) {
      const self = contenders.find(
        (contender) => contender.email === viewerEmail,
      )!;
      const own = statsOf(self.progress, scope, family, week);
      const row: HonorRow = {
        rank: 0,
        name: self.name,
        medals: own?.medals ?? 0,
        days: own?.days ?? 0,
        streak: own?.streak ?? 0,
        isMe: true,
      };
      me = placeOf(row, true);
    } else if (outsider) {
      const own = statsOf(outsider, scope, family, week);
      me = placeOf(
        {
          rank: 0,
          name: "",
          medals: own?.medals ?? 0,
          days: own?.days ?? 0,
          streak: own?.streak ?? 0,
          isMe: true,
        },
        false,
      );
    }

    return { rows, me };
  };

  const scopes: HonorScope[] = ["semana", "siempre"];
  const tables = Object.fromEntries(
    scopes.map((scope) => [
      scope,
      Object.fromEntries(
        HONOR_FAMILIES.map((family) => [
          family,
          Object.fromEntries(
            HONOR_SORTS.map((sort) => [sort, build(scope, family, sort)]),
          ),
        ]),
      ),
    ]),
  ) as HonorTables;

  return {
    tables,
    participants: contenders.length,
    weekFrom: keys[keys.length - 1],
    weekTo: keys[0],
  };
};
