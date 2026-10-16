import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import StudentsOnlyGate from "../components/StudentsOnlyGate";
import HonorToggle from "./HonorToggle";
import HonorView from "./HonorView";
import { PRIVADO } from "@/lib/seo";
import { currentStudent } from "@/lib/session";
import { categoryOf } from "@/lib/games";
import { getProgress } from "@/lib/progress";
import {
  getHonorBoard,
  HONOR_FAMILIES,
  HONOR_MIN_PARTICIPANTS,
  honorName,
} from "@/lib/honor";

// Nombres de alumnos: fuera de los buscadores, y solo con sesión (abajo).
export const metadata: Metadata = { title: "Cuadro de honor", robots: PRIVADO };

export const dynamic = "force-dynamic";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-10-10", "2026-10-16" → "Del 10 al 16 de octubre". */
const weekLabel = (from: string, to: string) => {
  const [, fromMonth, fromDay] = from.split("-").map(Number);
  const [, toMonth, toDay] = to.split("-").map(Number);
  return fromMonth === toMonth
    ? `Del ${fromDay} al ${toDay} de ${MONTHS[toMonth - 1]}`
    : `Del ${fromDay} de ${MONTHS[fromMonth - 1]} al ${toDay} de ${MONTHS[toMonth - 1]}`;
};

export default async function HonorPage() {
  const student = await currentStudent();

  // Los nombres de los alumnos solo los ven otros alumnos.
  if (!student) {
    return (
      <StudentsOnlyGate
        intro="El cuadro de honor es para los alumnos de 21st Century Music."
        backLabel="Volver a los juegos"
      >
        <></>
      </StudentsOnlyGate>
    );
  }

  // A quien no sale se le enseña el puesto que tendría, así que hace falta su
  // progreso. A quien sale ya se le lee con el resto del cuadro.
  const viewerProgress = student.showInHonor
    ? null
    : await getProgress(student.email).catch(() => null);
  const board = await getHonorBoard(student.email, viewerProgress).catch(() => null);
  const viewerName = honorName(student.displayName);

  return (
    <AppShell displayName={student.displayName} role={student.role}>
      {!board ? (
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-center text-sm text-white/60">
          Ahora mismo no se puede leer el cuadro de honor. Vuelve a probar en un rato.
        </div>
      ) : board.participants < HONOR_MIN_PARTICIPANTS ? (
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-3xl font-black italic tracking-tight md:text-4xl">Cuadro de honor</h1>
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 px-6 py-10 text-center shadow-lg">
            <p className="text-lg font-black text-white">Aún no hay cuadro</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/60">
              {student.showInHonor
                ? "Ya te has apuntado. En cuanto se apunte alguien más, aparecéis aquí."
                : "Sale en cuanto haya dos alumnos apuntados. Si te apuntas, ya va uno."}
            </p>
          </div>
          <footer className="mt-4">
            <HonorToggle initial={student.showInHonor} name={viewerName} />
          </footer>
        </div>
      ) : (
        <HonorView
          board={board}
          families={HONOR_FAMILIES.map((id) => ({
            id,
            label: id === "todo" ? "Todo" : categoryOf(id).label,
          }))}
          weekLabel={weekLabel(board.weekFrom, board.weekTo)}
          viewerName={viewerName}
          showInHonor={student.showInHonor}
        />
      )}
    </AppShell>
  );
}
