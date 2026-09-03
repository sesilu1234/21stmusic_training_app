// Las preguntas del trivial, que viven en Supabase (ver db/trivia.sql).
//
// Esto es de servidor: usa la service role key. No se importa desde un
// componente de cliente — el catálogo de temas, que sí lo usa el menú, está
// aparte en `lib/trivia.ts`.

import { getSupabaseAdmin } from "./supabaseAdmin";
import { ROUND_LENGTH } from "./roundLength";
import { TRIVIA_GENERAL, type TriviaQuestion } from "./trivia";

interface TriviaRow {
  pregunta: string;
  opcion_1: string;
  opcion_2: string;
  opcion_3: string;
  opcion_4: string;
  correcta: number;
}

/**
 * Baraja de verdad (Fisher-Yates).
 *
 * El `sort(() => Math.random() - 0.5)` que había antes en la pantalla del
 * trivial no baraja: el resultado depende del algoritmo de ordenación y deja
 * los elementos cerca de donde estaban. Aquí importa el doble, porque si la
 * opción correcta tiende a quedarse donde la escribieron, y quien las escribe
 * tiende a poner la buena la primera, se aprende el patrón sin saber nada.
 */
const barajar = <T>(list: T[]): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const toQuestion = (row: TriviaRow): TriviaQuestion => {
  const opciones = [row.opcion_1, row.opcion_2, row.opcion_3, row.opcion_4];
  return {
    pregunta: row.pregunta,
    // Se barajan al servirlas y no al guardarlas: así dos partidas del mismo
    // alumno con la misma pregunta no la enseñan igual.
    opciones: barajar(opciones),
    respuesta: opciones[row.correcta - 1],
  };
};

/**
 * Las preguntas de una partida, ya barajadas.
 *
 * El azar lo hace Postgres (`trivia_round`), no esto: traerse las quinientas
 * preguntas para quedarse con veinticuatro sería mandar por el cable veinte
 * veces lo que hace falta, y además con todas las respuestas dentro.
 *
 * Devuelve lista vacía si el tema no tiene preguntas o si la base de datos
 * falla. Quien la llama decide qué enseñar; lo que no puede pasar es que un
 * fallo de Supabase tire la página entera.
 */
export const getTriviaRound = async (tema: string): Promise<TriviaQuestion[]> => {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("trivia_round", {
      // El tema "general" no es un filtro, es la ausencia de filtro: `null` y
      // `trivia_round` sortea entre todas las preguntas de la tabla. Esto ya
      // estaba previsto en db/trivia.sql (`p_tema is null or tema = p_tema`);
      // lo único que faltaba era un nivel que lo usara.
      p_tema: tema === TRIVIA_GENERAL ? null : tema,
      p_limit: ROUND_LENGTH,
    });

    if (error) {
      console.error("[trivial] no se han podido leer las preguntas:", error.message);
      return [];
    }

    return ((data ?? []) as TriviaRow[]).map(toQuestion);
  } catch (error) {
    console.error("[trivial] no se han podido leer las preguntas:", error);
    return [];
  }
};

/**
 * Cuántas preguntas hay de cada tema. Lo usa el menú para avisar de los temas
 * que todavía no llegan para una partida entera, en vez de dejar que el alumno
 * entre y se encuentre una pantalla vacía.
 */
export const getTriviaCounts = async (): Promise<Record<string, number>> => {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("trivia_counts");
    if (error) {
      console.error("[trivial] no se han podido contar las preguntas:", error.message);
      return {};
    }

    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { tema: string; total: number }[]) {
      counts[row.tema] = Number(row.total);
    }

    /*
      El "general" juega con todas, así que su cuenta es la suma de todas — y no
      la de las preguntas escritas con tema "general", que es lo que devuelve la
      consulta. Sin esto el menú avisaría de que al tema de todos los temas le
      faltan preguntas, que es justo al revés.

      Se suma sobre `counts` después de llenarlo, para no contar dos veces las
      que sí llevan tema "general".
    */
    counts[TRIVIA_GENERAL] = Object.values(counts).reduce((a, b) => a + b, 0);

    return counts;
  } catch {
    return {};
  }
};
