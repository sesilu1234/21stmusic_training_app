import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import AppShell from "@/app/components/AppShell";
import StudentsOnlyGate from "@/app/components/StudentsOnlyGate";
import { PRIVADO } from "@/lib/seo";
import { currentStudent } from "@/lib/session";
import { displayNamesOf } from "@/lib/students";
import { formatDate } from "@/lib/format";
import { describeGiven, formatGrade, gradeOf } from "@/lib/exams/check";
import { getExamById, listAttemptsForExam } from "@/lib/exams/db";
import ShareCode from "../ShareCode";
import ExamResults, { CloseButton, type QuestionStat, type ResultRow } from "./ExamResults";

export const metadata: Metadata = { title: "Resultados del examen", robots: PRIVADO };

export const dynamic = "force-dynamic";

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await currentStudent();
  if (!student) {
    return (
      <StudentsOnlyGate intro="Los exámenes son para los alumnos de la escuela." backLabel="Volver a los juegos">
        <></>
      </StudentsOnlyGate>
    );
  }

  // Los resultados solo los ve quien creó el examen. A los demás, ni que existe.
  const exam = await getExamById(id);
  if (!exam || exam.creatorEmail !== student.email) notFound();

  const attempts = await listAttemptsForExam(exam.id);
  const names = await displayNamesOf(attempts.map((attempt) => attempt.studentEmail)).catch(
    () => new Map<string, string>(),
  );

  const finished = attempts.filter((attempt) => attempt.finishedAt);
  const inProgress = attempts.length - finished.length;

  const rows: ResultRow[] = finished.map((attempt) => ({
    id: attempt.id,
    name: names.get(attempt.studentEmail) ?? attempt.studentEmail,
    grade: formatGrade(gradeOf(attempt.correctCount, exam.questionCount)),
    correct: attempt.correctCount,
    total: exam.questionCount,
    date: formatDate(attempt.finishedAt!),
    answers: attempt.answers.map((answer) => {
      const question = exam.questions[answer.q];
      return {
        summary: question?.summary ?? "Pregunta",
        given: question ? describeGiven(question, answer.given) : String(answer.given),
        solution: question?.solution ?? "",
        correct: answer.correct,
        timedOut: answer.timedOut && answer.given === null,
      };
    }),
  }));

  // El % de cada pregunta, entre los que han llegado a contestarla.
  const stats: QuestionStat[] = exam.questions.map((question, index) => {
    const answers = attempts.flatMap((attempt) => attempt.answers.filter((answer) => answer.q === index));
    const right = answers.filter((answer) => answer.correct).length;
    return {
      summary: question.summary,
      solution: question.solution,
      answered: answers.length,
      percent: answers.length ? Math.round((right / answers.length) * 100) : null,
    };
  });

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link
          href="/examenes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white/55 transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Mis exámenes
        </Link>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-balance text-3xl font-black italic tracking-tight md:text-4xl">{exam.title}</h1>
            <p className="mt-1.5 text-xs text-white/60">
              {exam.closedAt ? "Cerrado" : "🟢 Abierto"} · {finished.length}{" "}
              {finished.length === 1 ? "entrega" : "entregas"}
              {inProgress > 0 && ` · ${inProgress} haciéndolo ahora`} · {exam.questionCount} preguntas ·{" "}
              {formatDate(exam.createdAt)}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-start gap-2">
            {/* El creador lo hace sin tiempo y sin que cuente, las veces que quiera. */}
            <Link
              href={`/examenes/${exam.id}/ver`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/40 bg-amber-400/15 px-4 py-2.5 text-xs font-black text-amber-100 transition hover:border-amber-300/70"
            >
              <Eye size={14} />
              Ver examen
            </Link>
            {!exam.closedAt && <CloseButton id={exam.id} />}
          </div>
        </header>

        {!exam.closedAt && <ShareCode code={exam.code} title={exam.title} />}

        <ExamResults rows={rows} stats={stats} />
      </div>
    </AppShell>
  );
}
