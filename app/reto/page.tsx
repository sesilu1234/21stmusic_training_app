import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import StudentsOnlyGate from "../components/StudentsOnlyGate";
import { PRIVADO } from "@/lib/seo";
import { currentStudent } from "@/lib/session";
import { madridDay, nextMadridMidnight } from "@/lib/madrid";
import { DAILY_EXAM, DAILY_SECTIONS, dailyExamNumber } from "@/lib/retoExamen";
import { describeAnswer } from "@/lib/exams/check";
import { getAttempt } from "@/lib/exams/db";
import { attemptMs, DAILY_TOP, getDailyBoard, getOrCreateDailyExam } from "@/lib/exams/daily";
import { serve } from "@/lib/exams/runner";
import ExamRunner from "../e/[code]/ExamRunner";
import DailyResult from "./DailyResult";
import DailyIcon from "../components/DailyIcon";
import RetoCards from "../components/EcoCard";
import { ECO_PULSO_PARKED } from "@/lib/reto";
import { retoStatuses } from "@/lib/ecoResult";

/** Eco y Pulso, debajo del reto, solo si se vuelven a sacar (lib/reto.ts). */
const ParkedRetos = async ({ student, day }: { student: { email: string; showInHonor: boolean }; day: string }) =>
  ECO_PULSO_PARKED ? null : <RetoCards day={day} statuses={await retoStatuses(student, day)} className="mx-auto mt-6 max-w-2xl" />;

export const metadata: Metadata = { title: DAILY_EXAM.name, robots: PRIVADO };

export const dynamic = "force-dynamic";

/** El reto diario: tres secciones de cinco preguntas, iguales para todos, un intento al día. */
export default async function RetoPage() {
  const student = await currentStudent();
  if (!student) {
    return (
      <StudentsOnlyGate
        intro="El reto diario es para los alumnos de la escuela."
        backLabel="Volver a los juegos"
        loginNext={DAILY_EXAM.href}
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  const day = madridDay();
  const exam = await getOrCreateDailyExam(day).catch((error) => {
    console.error("[examen del día] no se ha podido preparar:", error);
    return null;
  });

  if (!exam) {
    return (
      <AppShell displayName={student.displayName} role={student.role}>
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/70 p-7 text-center text-sm text-white/60">
          Ahora mismo no se puede preparar el reto de hoy. Vuelve a probar en un rato.
        </div>
      </AppShell>
    );
  }

  const started = await getAttempt(exam.id, student.email);
  // Si ya lo había empezado, sigue donde iba (y se cierran las que dejó sin tiempo).
  const view = started ? await serve(exam, started) : null;

  if (view?.phase !== "done") {
    return (
      <AppShell displayName={student.displayName} role={student.role}>
        <ExamRunner
          code={exam.code}
          cover={{
            title: `${DAILY_EXAM.name} #${dailyExamNumber(day)}`,
            byline: "Igual para todos · cambia a medianoche",
            questionCount: exam.questionCount,
            closed: false,
            // Los retos de antes de las secciones no las llevan.
            sections: exam.questions.some((question) => question.section) ? DAILY_SECTIONS : undefined,
            icon: <DailyIcon number={dailyExamNumber(day)} className="h-14 w-14 text-2xl" />,
          }}
          initialView={view}
          refreshOnDone
        />
        <ParkedRetos student={student} day={day} />
      </AppShell>
    );
  }

  // Acabado: `serve` puede haberlo cerrado ahora mismo, así que se vuelve a leer.
  const attempt = (await getAttempt(exam.id, student.email)) ?? started!;
  const board = await getDailyBoard(exam, student.email).catch(() => ({ top: [], myRank: 0, players: 0 }));

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <DailyResult
        number={dailyExamNumber(day)}
        correct={attempt.correctCount}
        total={exam.questionCount}
        ms={attemptMs(exam, attempt)}
        rank={board.myRank}
        listed={student.showInHonor}
        players={board.players}
        top={board.top.slice(0, DAILY_TOP)}
        nextAt={nextMadridMidnight().toISOString()}
        review={attempt.answers.map((answer) => {
          const question = exam.questions[answer.q];
          const described = question ? describeAnswer(question, answer.given) : null;
          return {
            title: question?.title ?? "Pregunta",
            summary: question?.summary ?? "",
            given: described?.given ?? String(answer.given),
            solution: described?.solution ?? "",
            correct: answer.correct,
            section: question?.section,
          };
        })}
      />
      <ParkedRetos student={student} day={day} />
    </AppShell>
  );
}
