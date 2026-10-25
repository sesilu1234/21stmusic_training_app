import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardCheck, PenLine, Plus } from "lucide-react";
import AppShell from "@/app/components/AppShell";
import StudentsOnlyGate from "@/app/components/StudentsOnlyGate";
import { PRIVADO } from "@/lib/seo";
import { currentStudent } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { formatGrade, gradeOf } from "@/lib/exams/check";
import { listAttemptsByStudent, listExamsByCreator } from "@/lib/exams/db";
import ShowMore from "./ShowMore";

export const metadata: Metadata = { title: "Exámenes", robots: PRIVADO };

export const dynamic = "force-dynamic";

const entregas = (count: number) => `${count} ${count === 1 ? "entrega" : "entregas"}`;

export default async function ExamsPage() {
  const student = await currentStudent();
  if (!student) {
    return (
      <StudentsOnlyGate
        intro="Los exámenes son para los alumnos de la escuela."
        backLabel="Volver a los juegos"
        loginNext="/examenes"
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  const [created, done] = await Promise.all([
    listExamsByCreator(student.email).catch(() => null),
    listAttemptsByStudent(student.email).catch(() => null),
  ]);

  // Abiertos primero y, dentro de cada grupo, del más reciente al más antiguo
  // (ya vienen así de la base de datos; `sort` es estable).
  const mine = created ? [...created].sort((a, b) => Number(Boolean(a.closedAt)) - Number(Boolean(b.closedAt))) : null;

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black italic tracking-tight md:text-4xl">Exámenes</h1>
            <p className="mt-1.5 text-xs text-white/60">Crea uno con los modos de juego y pasa el enlace.</p>
          </div>
          <Link
            href="/examenes/crear"
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-amber-300"
          >
            <Plus size={15} />
            Crear examen
          </Link>
        </header>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-amber-300">
            <PenLine size={14} strokeWidth={2.25} />
            Creados por mí
          </h2>
          {!mine ? (
            <p className="text-sm text-white/50">Ahora mismo no se pueden leer. Prueba en un rato.</p>
          ) : !mine.length ? (
            <p className="text-sm text-white/50">Todavía no has creado ninguno.</p>
          ) : (
            <ShowMore
              accent="text-amber-300 hover:text-amber-200"
              items={mine.map((exam) => (
                <li key={exam.id}>
                  <Link
                    href={`/examenes/${exam.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 transition hover:border-amber-300/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">{exam.title}</span>
                      <span className="mt-0.5 block text-[11px] text-white/55">
                        {exam.closedAt ? `Cerrado · ${entregas(exam.submissions)}` : `🟢 Abierto · ${entregas(exam.submissions)}`}
                        {" · "}
                        {formatDate(exam.createdAt)}
                      </span>
                    </span>
                    <ChevronRight size={16} className="flex-shrink-0 text-white/30 group-hover:text-white/70" />
                  </Link>
                </li>
              ))}
            />
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-sky-300">
            <ClipboardCheck size={14} strokeWidth={2.25} />
            Hechos por mí
          </h2>
          {!done ? (
            <p className="text-sm text-white/50">Ahora mismo no se pueden leer. Prueba en un rato.</p>
          ) : !done.length ? (
            <p className="text-sm text-white/50">Todavía no has hecho ninguno.</p>
          ) : (
            <ShowMore
              accent="text-amber-300 hover:text-amber-200"
              items={done.map((item) => (
                <li key={item.code}>
                  <Link
                    href={`/e/${item.code}`}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 transition hover:border-amber-300/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">{item.title}</span>
                      <span className="mt-0.5 block text-[11px] text-white/55">
                        {item.finishedAt ? formatDate(item.finishedAt) : "Sin terminar · sigue donde ibas"}
                      </span>
                    </span>
                    {item.finishedAt && (
                      <span className="flex-shrink-0 text-lg font-black tabular-nums text-amber-300">
                        {formatGrade(gradeOf(item.correct, item.total))}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
