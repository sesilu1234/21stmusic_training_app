import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/app/components/AppShell";
import StudentsOnlyGate from "@/app/components/StudentsOnlyGate";
import { PRIVADO } from "@/lib/seo";
import { currentStudent } from "@/lib/session";
import { madridDay } from "@/lib/madrid";
import ExamBuilder from "./ExamBuilder";

export const metadata: Metadata = { title: "Crear examen", robots: PRIVADO };

export const dynamic = "force-dynamic";

export default async function CreateExamPage() {
  const student = await currentStudent();
  if (!student) {
    return (
      <StudentsOnlyGate
        intro="Los exámenes son para los alumnos de la escuela."
        backLabel="Volver a los juegos"
        loginNext="/examenes/crear"
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  // "Examen del 25/10/2026". La fecha sale del servidor, en hora de Madrid,
  // para que no cambie al hidratar si el navegador va en otra zona.
  const [year, month, day] = madridDay().split("-");
  const defaultTitle = `Examen del ${day}/${month}/${year}`;

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/examenes"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-white/55 transition hover:text-white"
        >
          <ArrowLeft size={14} />
          Mis exámenes
        </Link>
        <h1 className="text-3xl font-black italic tracking-tight md:text-4xl">Crear examen</h1>
        <div className="mt-6">
          <ExamBuilder defaultTitle={defaultTitle} />
        </div>
      </div>
    </AppShell>
  );
}
