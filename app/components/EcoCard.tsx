import Link from "next/link";
import { RETOS, RETO_KINDS, retoNumber, scoreLabel, type RetoKind } from "@/lib/reto";

export type EcoCardStatus =
  | { kind: "guest" }
  | { kind: "todo" }
  /** Se cortó a medias: cuenta lo que llevaba. */
  | { kind: "unfinished"; score: number }
  | { kind: "done"; score: number; rank: number; listed: boolean };

const detailOf = (reto: RetoKind, status: EcoCardStatus) => {
  if (status.kind === "guest") return "Entra para jugar";
  if (status.kind === "todo") return "Hoy todavía no has jugado";
  if (status.kind === "unfinished") return `${scoreLabel(reto, status.score)} · se cortó`;
  return `${scoreLabel(reto, status.score)}${
    status.rank > 0 ? ` · ${status.listed ? "" : "irías "}${status.rank}º de hoy` : ""
  }`;
};

/**
 * Los dos retos del día, uno al lado del otro: arriba del todo en la portada y
 * en /reto. Cada tarjeta dice qué número es hoy y cómo te ha ido; sin haber
 * jugado, es la invitación a jugarlo.
 */
export default function RetoCards({
  day,
  statuses,
  className = "mb-7",
}: {
  day: string;
  statuses: Record<RetoKind, EcoCardStatus>;
  className?: string;
}) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {RETO_KINDS.map((kind) => {
        const reto = RETOS[kind];
        const status = statuses[kind];
        const pending = status.kind === "todo" || status.kind === "guest";
        return (
          <Link
            key={kind}
            href={`/reto/${kind}`}
            className="group flex items-center gap-3.5 rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-400/15 via-slate-950/70 to-slate-950/70 px-4 py-3.5 shadow-lg transition hover:border-amber-300/50"
          >
            <span
              aria-hidden
              className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-amber-400/20 text-2xl leading-none text-amber-200"
            >
              {reto.symbol}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black tracking-tight text-white">
                {reto.name} <span className="font-normal text-white/50">#{retoNumber(kind, day)}</span>
              </span>
              <span className="block truncate text-xs text-white/60">{detailOf(kind, status)}</span>
            </span>
            <span
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                pending
                  ? "bg-amber-400 text-slate-950 group-hover:bg-amber-300"
                  : "border border-white/15 text-white/70 group-hover:text-white"
              }`}
            >
              {pending ? "Jugar" : "Ver"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
