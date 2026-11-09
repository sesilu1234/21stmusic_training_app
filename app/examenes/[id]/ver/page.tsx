import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import StudentsOnlyGate from "@/app/components/StudentsOnlyGate";
import { PRIVADO } from "@/lib/seo";
import { currentStudent } from "@/lib/session";
import { rngFor, shuffleWith } from "@/lib/seeded";
import { getExamById } from "@/lib/exams/db";
import type { ExamQuestion } from "@/lib/exams/types";
import ExamPreview from "./ExamPreview";

export const metadata: Metadata = { title: "Ver examen", robots: PRIVADO };

export const dynamic = "force-dynamic";

export default async function ExamPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await currentStudent();
  if (!student) {
    return (
      <StudentsOnlyGate intro="Los exámenes son para los alumnos de la escuela." backLabel="Volver a los juegos">
        <></>
      </StudentsOnlyGate>
    );
  }

  // Solo su creador: aquí van las preguntas enteras, con las respuestas.
  const exam = await getExamById(id);
  if (!exam || exam.creatorEmail !== student.email) notFound();

  // Las opciones se guardan con la buena delante: se barajan igual que a un
  // alumno, con la semilla del examen y el correo de quien mira.
  const questions: ExamQuestion[] = exam.questions.map((question, index) =>
    question.input.type === "choice"
      ? {
          ...question,
          input: {
            type: "choice",
            options: shuffleWith(
              question.input.options,
              rngFor(`examen:${exam.seed}:opciones:${student.email}:${index}`),
            ),
          },
        }
      : question,
  );

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <ExamPreview examId={exam.id} title={exam.title} questions={questions} />
    </AppShell>
  );
}
