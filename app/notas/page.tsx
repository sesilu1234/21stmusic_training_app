import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import { PRIVADO } from "@/lib/seo";
import StudentsOnlyGate from "../components/StudentsOnlyGate";
import NotesBoard from "./NotesBoard";
import { currentStudent } from "@/lib/session";
import { listNotes } from "@/lib/notes";

// Apuntes personales del alumno. Fuera de los buscadores, obviamente.
export const metadata: Metadata = { title: "Notas", robots: PRIVADO };

// Las notas cambian en cuanto escribes una, así que no se cachea.
export const dynamic = "force-dynamic";

export default async function NotasPage() {
  const student = await currentStudent();

  // Antes se podía escribir sin cuenta porque se guardaba en el navegador.
  // Ahora van a la cuenta del alumno, así que hace falta entrar.
  if (!student) {
    return (
      <StudentsOnlyGate
        intro="Tus notas se guardan en tu cuenta, así que las tienes en cualquier aparato."
        backLabel="Volver a los juegos"
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  // Que se caiga la base de datos no puede dejar la pantalla en blanco: se
  // enseña vacía y ya avisará la acción si tampoco puede guardar.
  const notes = await listNotes(student.email).catch(() => []);

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <h1 className="text-2xl font-black italic tracking-tight md:text-4xl">Mis notas</h1>
          <p className="mt-1 text-xs text-white/50">
            Apuntes rápidos de estudio. Se guardan en tu cuenta, así que los
            tienes en el móvil y en el ordenador.
          </p>
        </header>

        <NotesBoard initialNotes={notes} />
      </div>
    </AppShell>
  );
}
