import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "../../components/AppShell";
import StudentsOnlyGate from "../../components/StudentsOnlyGate";
import { PRIVADO } from "@/lib/seo";
import { currentStudent } from "@/lib/session";
import { madridDay } from "@/lib/madrid";
import { RETOS, isRetoKind } from "@/lib/reto";
import { getEcoPlay } from "@/lib/ecoDb";
import { buildEcoResult } from "@/lib/ecoResult";
import RetoView from "../RetoView";

export const metadata: Metadata = { title: "Reto diario", robots: PRIVADO };

export const dynamic = "force-dynamic";

export default async function RetoPage({ params }: { params: Promise<{ reto: string }> }) {
  const { reto } = await params;
  if (!isRetoKind(reto)) notFound();

  const student = await currentStudent();
  if (!student) {
    return (
      <StudentsOnlyGate
        intro={`El reto ${RETOS[reto].name} es para los alumnos de la escuela.`}
        backLabel="Volver a los juegos"
        loginNext={`/reto/${reto}`}
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  const day = madridDay();
  const play = await getEcoPlay(student.email, day, reto).catch(() => null);
  // Si ya jugó hoy (o se le cortó a medias), directo al resultado.
  const result = play ? await buildEcoResult(student.email, student.showInHonor, reto, day, play) : null;

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      <RetoView kind={reto} today={day} initialResult={result} />
    </AppShell>
  );
}
