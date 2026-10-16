"use server";

import { currentStudent } from "@/lib/session";
import { gameFromPath } from "@/lib/games";
import { getProgress, recordAttempt, type SaveResult } from "@/lib/progress";

const NOT_SAVED: SaveResult = { saved: false, newMedal: false, streak: 0 };

/**
 * Guarda la partida que acaba de terminar.
 *
 * La llama el modal de fin de partida, que es por donde pasan todos los modos.
 * En vez de que cada juego diga cómo se llama —quince sitios que se pueden
 * quedar desfasados—, se saca de la ruta: /play/piano/notas/sol-naturales es el
 * modo "Notas en el teclado", nivel "sol-naturales".
 *
 * Sin sesión no se guarda nada y no pasa nada: jugar sin cuenta sigue
 * funcionando igual, solo que no queda registro.
 */
export const saveAttempt = async (input: {
  pathname: string;
  correct: number;
  total: number;
}): Promise<SaveResult> => {
  const student = await currentStudent();
  if (!student) return NOT_SAVED;

  const found = gameFromPath(String(input.pathname ?? ""));
  if (!found) return NOT_SAVED;

  try {
    return await recordAttempt({
      email: student.email,
      gameName: found.game.name,
      levelSlug: found.levelSlug,
      correct: Number(input.correct),
      total: Number(input.total),
    });
  } catch (error) {
    // Que se caiga la base de datos no puede estropear el final de la partida:
    // el alumno ve su resultado igual, simplemente no queda guardado.
    //
    // Pero callarlo del todo era peor: si Supabase empezara a rechazar los
    // inserts, los alumnos dejarían de acumular progreso y no se enteraría
    // nadie nunca. Esto corre en el servidor, así que sale en los registros del
    // despliegue y no en la consola del alumno.
    console.error("[progreso] no se ha podido guardar la partida:", error);
    return NOT_SAVED;
  }
};

/**
 * Las rutas de los niveles con medalla, para pintarla en los submenús.
 *
 * Van como ruta entera ("/play/construye-escalas/mayores") porque así es como
 * las tienen los enlaces de cada tarjeta, y el submenú solo tiene que
 * compararlas. `levels` son todos los niveles que existen, con o sin medalla:
 * hacen falta para las tarjetas que agrupan varios (Nombrar / Escribir en el
 * pentagrama), que llevan medalla cuando están todos los de dentro.
 *
 * Sin sesión, o si la consulta falla, no hay medallas y ya está: el menú sale
 * igual.
 */
export const getLevelMedals = async (): Promise<{
  medals: string[];
  levels: string[];
}> => {
  const student = await currentStudent();
  if (!student) return { medals: [], levels: [] };

  try {
    const progress = await getProgress(student.email);
    const levels = progress.games.flatMap((entry) =>
      entry.levels.map((level) => ({
        path: `${entry.game.slug}/${level.slug}`,
        hasMedal: level.hasMedal,
      })),
    );
    return {
      medals: levels.filter((level) => level.hasMedal).map((level) => level.path),
      levels: levels.map((level) => level.path),
    };
  } catch (error) {
    console.error("[progreso] no se han podido leer las medallas:", error);
    return { medals: [], levels: [] };
  }
};
