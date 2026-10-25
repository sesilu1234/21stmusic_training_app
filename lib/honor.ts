// El cuadro de honor: quién lleva más medallas desde siempre.
//
// Nada de esto se guarda. Sale del mismo `getProgress` que el panel de cada
// alumno, así que la cifra del cuadro es exactamente la que cada uno ve en su
// progreso: si no cuadrara, alguien lo notaría enseguida.
//
// Reglas:
//
//   · Sale todo el mundo con su nombre completo, menos quien se haya quitado
//     desde el menú de su usuario (`show_in_honor`, db/honor_todos.sql). Quien
//     se quita no sale en ningún ranking, ni aquí ni en el del reto.
//   · Solo con sesión: los nombres de los alumnos solo los ven otros alumnos.
//   · Con cero medallas no hay puesto: no se enseña a nadie el último.
//
// De servidor, como lib/progress.ts.

import { getProgress, type Progress } from "./progress";
import { listHonorStudents } from "./students";

/**
 * Cuánto tiempo se reutiliza el cuadro ya calculado.
 *
 * Calcularlo es pedir el progreso de cada alumno que sale, y la portada lo
 * enseña en cada visita. Cinco minutos de retraso en un ranking no los nota
 * nadie; cuarenta consultas por cada vez que alguien abre la portada, sí.
 * Cuando un alumno se quita o se vuelve a poner, se tira y se rehace al momento.
 */
const CACHE_MS = 5 * 60 * 1000;

export interface HonorRow {
  /** Empates, mismo puesto (1, 1, 3…). */
  rank: number;
  name: string;
  medals: number;
  /** Es quien está mirando. */
  isMe: boolean;
}

export interface HonorMe {
  /** 0 si todavía no tiene ninguna medalla. */
  rank: number;
  medals: number;
  /** false si se ha quitado del cuadro: entonces el puesto es el que tendría. */
  listed: boolean;
}

export interface HonorBoard {
  /** Todos los que tienen alguna medalla, de más a menos. */
  rows: HonorRow[];
  /** El sitio de quien mira. null si no se ha podido calcular. */
  me: HonorMe | null;
  /** Cuántos salen en el cuadro, tengan medallas o no. */
  participants: number;
}

interface Contender {
  email: string;
  name: string;
  medals: number;
}

let cache: { at: number; contenders: Contender[] } | null = null;

/** Tira el cuadro guardado: lo llama quien se quita o se vuelve a poner. */
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
        ? { email: student.email, name: student.displayName.trim(), medals: progress.medals }
        : null;
    }),
  );

  const contenders = results.filter((entry): entry is Contender => entry !== null);
  cache = { at: Date.now(), contenders };
  return contenders;
};

/**
 * El cuadro, visto por un alumno. `viewerEmail` solo sirve para marcar su
 * fila: el correo de nadie sale de aquí.
 *
 * `viewerProgress` es para quien NO sale: con él se le dice qué puesto
 * tendría, sin meterle en la tabla. Si no se pasa, a ese alumno no se le
 * calcula.
 */
export const getHonorBoard = async (
  viewerEmail: string | null,
  viewerProgress: Progress | null = null,
): Promise<HonorBoard> => {
  const contenders = await loadContenders();

  const ranked = contenders
    .filter((contender) => contender.medals > 0)
    .sort((a, b) => b.medals - a.medals || a.name.localeCompare(b.name, "es"));

  const rows: HonorRow[] = [];
  ranked.forEach((contender, index) => {
    const previous = rows[index - 1];
    const tied = previous && previous.medals === contender.medals;
    rows.push({
      rank: tied ? previous.rank : index + 1,
      name: contender.name,
      medals: contender.medals,
      isMe: contender.email === viewerEmail,
    });
  });

  const self = contenders.find((contender) => contender.email === viewerEmail);
  let me: HonorMe | null = null;

  if (self) {
    const row = rows.find((entry) => entry.isMe);
    me = { rank: row?.rank ?? 0, medals: self.medals, listed: true };
  } else if (viewerProgress) {
    const medals = viewerProgress.medals;
    me = {
      rank: medals > 0 ? rows.filter((row) => row.medals > medals).length + 1 : 0,
      medals,
      listed: false,
    };
  }

  return { rows, me, participants: contenders.length };
};
