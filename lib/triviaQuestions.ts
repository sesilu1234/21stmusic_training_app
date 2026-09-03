// Las preguntas del trivial, que viven en Supabase (ver db/trivia.sql).
//
// Esto es de servidor: usa la service role key. No se importa desde un
// componente de cliente — el catálogo de temas, que sí lo usa el menú, está
// aparte en `lib/trivia.ts`.

import { getSupabaseAdmin } from "./supabaseAdmin";
import { ROUND_LENGTH } from "./roundLength";
import type { TriviaQuestion } from "./trivia";

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
      p_tema: tema,
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
    return counts;
  } catch {
    return {};
  }
};
