import TriviaMenu from "./TriviaMenu";
import { getTriviaCounts } from "@/lib/triviaQuestions";

/**
 * El trivial dejó de ser una sola pantalla y pasó a ser un menú de temas.
 *
 * Los temas son los niveles del modo (ver `lib/trivia.ts`), así que esto se
 * comporta igual que el menú de lectura de notas o el de piano.
 */

// Las preguntas se cuentan en cada visita: es una consulta agregada de nada, y
// así el menú refleja al momento lo que se acabe de importar en Supabase sin
// tener que volver a desplegar.
export const dynamic = "force-dynamic";

export default async function TriviaMenuPage() {
  const counts = await getTriviaCounts();
  return <TriviaMenu counts={counts} />;
}
