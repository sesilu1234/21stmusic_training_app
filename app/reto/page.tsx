import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import StudentsOnlyGate from "../components/StudentsOnlyGate";
import RetoCards from "../components/EcoCard";
import { PRIVADO } from "@/lib/seo";
import { currentStudent } from "@/lib/session";
import { madridDay } from "@/lib/madrid";
import { retoStatuses } from "@/lib/ecoResult";

export const metadata: Metadata = { title: "Retos diarios", robots: PRIVADO };

export const dynamic = "force-dynamic";

/** Los dos retos de hoy: Eco (memoria y oído) y Pulso (ritmo). */
export default async function RetosPage() {
  const student = await currentStudent();
  if (!student) {
    return (
      <StudentsOnlyGate
        intro="Los retos diarios son para los alumnos de la escuela."
        backLabel="Volver a los juegos"
        loginNext="/reto"
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  const day = madridDay();
  const statuses = await retoStatuses(student, day);

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl font-black italic tracking-tight md:text-4xl">Retos de hoy</h1>
        <p className="mt-1.5 text-xs text-white/60">
          Dos cada día, iguales para todos: uno de oído y memoria, otro de ritmo. Un intento de cada uno; cambian a
          medianoche.
        </p>
        <RetoCards day={day} statuses={statuses} className="mt-6" />
      </div>
    </AppShell>
  );
}
