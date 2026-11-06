import Link from "next/link";
import DailyIcon from "./DailyIcon";
import {
  DAILY_EXAM,
  DAILY_SECTIONS,
  correctLabel,
  dailyExamNumber,
  durationLabel,
  type DailyExamStatus,
} from "@/lib/retoExamen";

const detailOf = (status: DailyExamStatus) => {
  if (status.kind === "guest") return "Entra para hacerlo";
  if (status.kind === "todo") return `${DAILY_SECTIONS.length} secciones · ${DAILY_EXAM.questions} preguntas · ¿cuántas sacas?`;
  if (status.kind === "doing") return `A medias · llevas ${status.answered} de ${status.total}`;
  return `${correctLabel(status.correct, status.total)} en ${durationLabel(status.ms)}${
    status.rank > 0 ? ` · ${status.listed ? "" : "irías "}${status.rank}º de hoy` : ""
  }`;
};

/**
 * El examen del día: arriba del todo en la portada y en /reto. Dice qué
 * número es hoy y cómo te ha ido; sin haberlo hecho, es la invitación.
 */
export default function DailyExamCard({
  day,
  status,
  className = "mb-7",
  tall = false,
}: {
  day: string;
  status: DailyExamStatus;
  className?: string;
  /** En la portada, al lado de los rankings: de pantalla mediana arriba va en columna. */
  tall?: boolean;
}) {
  const label = status.kind === "done" ? "Ver" : status.kind === "doing" ? "Seguir" : "Jugar";
  const pending = status.kind !== "done";
  return (
    <Link
      href={DAILY_EXAM.href}
      className={`group flex items-center gap-3.5 ${tall ? "md:flex-col md:items-start md:justify-between md:gap-3" : ""} rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-400/15 via-slate-950/70 to-slate-950/70 px-4 py-3.5 shadow-lg transition hover:border-amber-300/50 ${className}`}
    >
      <DailyIcon number={dailyExamNumber(day)} className="h-11 w-11 text-lg" />
      <span className={`min-w-0 flex-1 ${tall ? "md:flex-none" : ""}`}>
        <span className="block text-sm font-black tracking-tight text-white">
          {DAILY_EXAM.name} <span className="font-normal text-white/50">#{dailyExamNumber(day)}</span>
        </span>
        <span className={`block truncate text-xs text-white/60 ${tall ? "md:mt-0.5 md:whitespace-normal" : ""}`}>
          {detailOf(status)}
        </span>
      </span>
      <span
        className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-center ${tall ? "md:self-stretch md:py-2" : ""} text-[10px] font-black uppercase tracking-[0.16em] transition ${
          pending
            ? "bg-amber-400 text-slate-950 group-hover:bg-amber-300"
            : "border border-white/15 text-white/70 group-hover:text-white"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
