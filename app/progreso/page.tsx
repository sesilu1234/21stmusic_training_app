import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import { PRIVADO } from "@/lib/seo";
import StudentsOnlyGate from "../components/StudentsOnlyGate";
import ProgressBoard from "./ProgressBoard";
import { currentStudent } from "@/lib/session";
import { getProgress } from "@/lib/progress";

// El panel de un alumno concreto: fuera de los buscadores. `PRIVADO` es
// index:false + follow:false, porque desde aquí se enlaza a más páginas suyas.
export const metadata: Metadata = { title: "Progreso", robots: PRIVADO };

// El progreso cambia con cada partida, así que no se cachea.
export const dynamic = "force-dynamic";

export default async function ProgresoPage() {
  const student = await currentStudent();

  // Sin cuenta no hay progreso que enseñar: la misma puerta que la guía.
  if (!student) {
    return (
      <StudentsOnlyGate
        intro="El panel de progreso es para los alumnos de 21st Century Music."
        backLabel="Volver a los juegos"
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  const progress = await getProgress(student.email).catch(() => null);

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-black italic tracking-tight md:text-4xl">
            Tu progreso
          </h1>
          <p className="mt-1 text-xs text-white/50">
            Lo que llevas jugado, modo por modo.
          </p>
        </header>

        {progress ? (
          <ProgressBoard displayName={student.displayName} progress={progress} />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-center text-sm text-white/45">
            Ahora mismo no se puede leer tu progreso. Vuelve a probar en un rato:
            las partidas se siguen guardando igual.
          </div>
        )}
      </div>
    </AppShell>
  );
}
