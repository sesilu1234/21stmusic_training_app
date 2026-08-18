import { isKnownGame } from "@/lib/games";
import { safeAuth } from "@/lib/session";
import { getStudent, recordAttempt } from "@/lib/students";

export async function POST(request: Request) {
  const session = await safeAuth();
  const student = await getStudent(session?.user?.email);
  if (!student) return Response.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  const game = String(body?.game || "");
  const total = Math.trunc(Number(body?.total));
  const correct = Math.trunc(Number(body?.correct));

  const validGame = isKnownGame(game);
  const validTotal = Number.isFinite(total) && total > 0 && total <= 500;
  const validCorrect = Number.isFinite(correct) && correct >= 0 && correct <= total;

  if (!validGame || !validTotal || !validCorrect) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const result = await recordAttempt(student.email, game, correct, total);
  return Response.json({ ok: true, ...result });
}
