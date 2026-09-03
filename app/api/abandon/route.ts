import { currentStudent } from "@/lib/session";
import { gameFromPath } from "@/lib/games";
import { recordAttempt } from "@/lib/progress";

/**
 * La partida que el alumno deja a medias.
 *
 * Es una ruta de API y no una server action como `saveAttempt` porque quien la
 * llama es `navigator.sendBeacon`, desde el evento de cerrar o cambiar de
 * página. Ahí ya no se puede hacer un fetch normal: el navegador cancela lo que
 * haya en vuelo al descargar la página. `sendBeacon` se lo queda él, lo manda
 * por su cuenta y no retrasa nada — pero solo sabe hacer un POST simple a una
 * URL, así que hace falta esto.
 *
 * Sin sesión no se guarda nada, igual que las partidas terminadas: quien entra
 * desde internet sin cuenta no escribe una sola fila.
 */
export async function POST(req: Request) {
  const student = await currentStudent();
  if (!student) return new Response(null, { status: 204 });

  let body: { pathname?: unknown; correct?: unknown; total?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const found = gameFromPath(String(body.pathname ?? ""));
  if (!found) return new Response(null, { status: 204 });

  const total = Math.floor(Number(body.total));
  const correct = Math.floor(Number(body.correct));

  // `total` aquí son las preguntas CONTESTADAS, no las de la partida entera:
  // abrir la pantalla y salir sin tocar nada no es una partida abandonada, es
  // no haber jugado, y no tiene por qué dejar rastro.
  if (!Number.isFinite(total) || total < 1) return new Response(null, { status: 204 });
  if (!Number.isFinite(correct) || correct < 0 || correct > total) {
    return new Response(null, { status: 204 });
  }

  try {
    await recordAttempt({
      email: student.email,
      gameName: found.game.name,
      levelSlug: found.levelSlug,
      correct,
      total,
      completed: false,
    });
  } catch (error) {
    // Nadie está esperando esta respuesta: la página ya se ha ido. Lo único
    // que se puede hacer con el fallo es dejarlo escrito en los registros.
    console.error("[progreso] no se ha podido guardar la partida abandonada:", error);
  }

  // 204 siempre: no hay nada que contestarle a una página que ya no existe, y
  // un código de error solo serviría para llenar la consola de errores rojos
  // en el navegador de quien se está yendo.
  return new Response(null, { status: 204 });
}
