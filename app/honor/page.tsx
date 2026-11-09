import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "../components/AppShell";
import StudentsOnlyGate from "../components/StudentsOnlyGate";
import HonorView, { type EcoToday, type ExamBoards } from "./HonorView";
import { PRIVADO } from "@/lib/seo";
import { HONOR_ENABLED, HONOR_MEDALS_VISIBLE } from "@/lib/site";
import { currentStudent } from "@/lib/session";
import { getProgress } from "@/lib/progress";
import { getHonorBoard } from "@/lib/honor";
import { madridDay, previousDay } from "@/lib/madrid";
import { ECO_PULSO_PARKED, RETO_KINDS, retoNumber, type RetoKind } from "@/lib/reto";
import { getEcoDayBoard, getTodayPlays } from "@/lib/ecoDb";
import { dailyExamStatus, getDayBoard } from "@/lib/exams/daily";
import { DAILY_EXAM } from "@/lib/retoExamen";

/**
 * El reto diario de hoy y de otro día para el cuadro: ayer, o el que se haya
 * elegido en el calendario. Si nadie lo abrió ese día, sale vacío.
 */
const examBoards = async (
  student: { email: string; showInHonor: boolean },
  day: string,
  past: string,
): Promise<ExamBoards> => {
  const [today, yesterday, status] = await Promise.all([
    getDayBoard(day, student.email),
    getDayBoard(past, student.email),
    dailyExamStatus(student, day),
  ]);
  return { today, yesterday, status };
};

/**
 * El día que se mira en la segunda tarjeta (`?dia=2026-10-29`). Solo días ya
 * cerrados, del primer reto a ayer: cualquier otra cosa, ayer.
 */
const pickPastDay = (wanted: string | undefined, day: string) => {
  const yesterday = previousDay(day);
  if (!wanted || !/^\d{4}-\d{2}-\d{2}$/.test(wanted)) return yesterday;
  if (wanted < DAILY_EXAM.launch || wanted > yesterday) return yesterday;
  return wanted;
};

// Nombres de alumnos: fuera de los buscadores, y solo con sesión (abajo).
export const metadata: Metadata = { title: "Cuadro de honor", robots: PRIVADO };

export const dynamic = "force-dynamic";

export default async function HonorPage({
  searchParams,
}: {
  searchParams?: Promise<{ dia?: string }>;
}) {
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
  const past = pickPastDay((await searchParams)?.dia, day);

  // A quien no sale se le enseña el puesto que tendría, así que hace falta su
  // progreso. A quien sale ya se le lee con el resto del cuadro.
  // Con las medallas escondidas no hace falta nada de esto.
  const viewerProgress =
    !HONOR_MEDALS_VISIBLE || student.showInHonor ? null : await getProgress(student.email).catch(() => null);

  const [board, examen, plays, ...boards] = await Promise.all([
    HONOR_MEDALS_VISIBLE ? getHonorBoard(student.email, viewerProgress).catch(() => null) : null,
    examBoards(student, day, past).catch(() => ({ today: null, yesterday: null, status: null })),
    // Eco y Pulso, solo si no están aparcados.
    ECO_PULSO_PARKED ? null : getTodayPlays(student.email, day).catch(() => ({ eco: null, pulso: null })),
    ...(ECO_PULSO_PARKED ? [] : RETO_KINDS.map((kind) => getEcoDayBoard(day, kind, student.email).catch(() => null))),
  ]);

  const retos = ECO_PULSO_PARKED
    ? null
    : (Object.fromEntries(
    RETO_KINDS.map((kind, index): [RetoKind, EcoToday | null] => {
      const reto = boards[index];
      const play = plays?.[kind];
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
  ) as Record<RetoKind, EcoToday | null>);

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      {/* Si las medallas no se pueden leer, se quedan fuera; lo del reto sale igual. */}
      <HonorView board={board} examen={examen} retos={retos} day={day} past={past} />
    </AppShell>
  );
}
