import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import StudentsOnlyGate from "@/app/components/StudentsOnlyGate";
import { PRIVADO } from "@/lib/seo";
import { currentStudent } from "@/lib/session";
import { displayNamesOf } from "@/lib/students";
import { getAttempt, getExamByCode, normalizeCode } from "@/lib/exams/db";
import { serve, type ExamView } from "@/lib/exams/runner";
import ExamRunner from "./ExamRunner";

export const metadata: Metadata = { title: "Examen", robots: PRIVADO };

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = normalizeCode(raw);
  const student = await currentStudent();

  if (!student) {
    return (
      <StudentsOnlyGate
        intro="Los exámenes son para los alumnos de la escuela."
        backLabel="Volver a los juegos"
        loginNext={`/e/${code}`}
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  const exam = await getExamByCode(code).catch(() => null);

  if (!exam) {
    return (
      <AppShell displayName={student.displayName} role={student.role}>
        <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/70 p-7 text-center">
          <p className="text-lg font-black text-white">No hay ningún examen con ese código</p>
          <p className="mt-2 text-sm text-white/60">Revisa que esté bien copiado: son 12 letras y números.</p>
          <Link href="/examenes" className="mt-5 inline-block text-sm font-bold text-amber-300 hover:text-amber-200">
            Ir a mis exámenes →
          </Link>
        </div>
      </AppShell>
    );
  }

  // Su creador no lo hace como un alumno más: lo ve sin tiempo y sin contar.
  if (exam.creatorEmail === student.email) redirect(`/examenes/${exam.id}/ver`);

  const [attempt, names] = await Promise.all([
    getAttempt(exam.id, student.email),
    displayNamesOf([exam.creatorEmail]).catch(() => new Map<string, string>()),
  ]);

  // Si ya lo había empezado, sigue donde iba: sin portada, con el tiempo que le quedaba.
  const view: ExamView | null = attempt ? await serve(exam, attempt) : null;

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <ExamRunner
        code={exam.code}
        cover={{
          title: exam.title,
          creatorName: names.get(exam.creatorEmail) ?? "alguien de la escuela",
          questionCount: exam.questionCount,
          closed: Boolean(exam.closedAt),
        }}
        initialView={view}
      />
    </AppShell>
  );
}
