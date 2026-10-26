import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "../components/AppShell";
import StudentsOnlyGate from "../components/StudentsOnlyGate";
import HonorView, { type EcoToday } from "./HonorView";
import { PRIVADO } from "@/lib/seo";
import { HONOR_ENABLED } from "@/lib/site";
import { currentStudent } from "@/lib/session";
import { getProgress } from "@/lib/progress";
import { getHonorBoard } from "@/lib/honor";
import { madridDay } from "@/lib/madrid";
import { RETO_KINDS, retoNumber, type RetoKind } from "@/lib/reto";
import { getEcoDayBoard, getTodayPlays } from "@/lib/ecoDb";

// Nombres de alumnos: fuera de los buscadores, y solo con sesión (abajo).
export const metadata: Metadata = { title: "Cuadro de honor", robots: PRIVADO };

export const dynamic = "force-dynamic";

export default async function HonorPage() {
  if (!HONOR_ENABLED) notFound();

  const student = await currentStudent();

  // Los nombres de los alumnos solo los ven otros alumnos.
  if (!student) {
    return (
      <StudentsOnlyGate
        intro="El cuadro de honor es para los alumnos de 21st Century Music."
        backLabel="Volver a los juegos"
        loginNext="/honor"
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  const day = madridDay();

  // A quien no sale se le enseña el puesto que tendría, así que hace falta su
  // progreso. A quien sale ya se le lee con el resto del cuadro.
  const viewerProgress = student.showInHonor ? null : await getProgress(student.email).catch(() => null);

  const [board, plays, ...boards] = await Promise.all([
    getHonorBoard(student.email, viewerProgress).catch(() => null),
    getTodayPlays(student.email, day).catch(() => ({ eco: null, pulso: null })),
    ...RETO_KINDS.map((kind) => getEcoDayBoard(day, kind, student.email).catch(() => null)),
  ]);

  const retos = Object.fromEntries(
    RETO_KINDS.map((kind, index): [RetoKind, EcoToday | null] => {
      const reto = boards[index];
      const play = plays[kind];
      return [
        kind,
        reto
          ? {
              kind,
              number: retoNumber(kind, day),
              top: reto.top,
              players: reto.players,
              myScore: play ? (play.score ?? 0) : null,
            }
          : null,
      ];
    }),
  ) as Record<RetoKind, EcoToday | null>;

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      {board ? (
        <HonorView board={board} retos={retos} day={day} />
      ) : (
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-center text-sm text-white/60">
          Ahora mismo no se puede leer el cuadro de honor. Vuelve a probar en un rato.
        </div>
      )}
    </AppShell>
  );
}
