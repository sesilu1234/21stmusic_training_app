"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DayPicker from "./DayPicker";
import { previousDay } from "@/lib/madrid";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
// Solo tipos: lib/honor.ts y lib/ecoDb.ts son de servidor.
import type { HonorBoard, HonorRow } from "@/lib/honor";
import type { EcoRankRow } from "@/lib/ecoDb";
import { RETOS, RETO_KINDS, scoreLabel, type RetoKind } from "@/lib/reto";
import {
  DAILY_EXAM,
  correctLabel,
  durationLabel,
  type DailyDayBoard,
  type DailyExamStatus,
} from "@/lib/retoExamen";

/** Medallas: los diez primeros con su barra; del resto, fichas de 30 en 30 con "Ver más". */
const BARS = 10;
const CHIPS_PAGE = 30;

/** Reto diario: cuántos caben en cada página de hoy y de ayer. */
const DAY_PAGE = 10;

/** Oro, plata y bronce. */
const PLACE_DISC: Record<number, string> = {
  1: "bg-amber-300 text-amber-950",
  2: "bg-slate-300 text-slate-900",
  3: "bg-orange-300 text-orange-950",
};

const medalsLabel = (count: number) => `${count} ${count === 1 ? "medalla" : "medallas"}`;

/** "lunes 26 de octubre", del día de Madrid que manda el servidor (sin hora: no depende del navegador). */
const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${day}T12:00:00Z`),
  );

const Place = ({ rank }: { rank: number }) => (
  <span
    className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[11px] font-black tabular-nums ${
      PLACE_DISC[rank] ?? "text-white/40"
    }`}
  >
    {rank}
  </span>
);

const Row = ({ rank, name, value, isMe }: { rank: number; name: string; value: string; isMe: boolean }) => (
  <li className={`flex items-center gap-3 rounded-xl px-3 py-2 ${isMe ? "bg-amber-300/10" : ""}`}>
    <Place rank={rank} />
    <span className={`min-w-0 flex-1 truncate text-sm ${isMe ? "font-bold text-amber-100" : "text-white/85"}`}>
      {name}
      {isMe && <span className="ml-1.5 text-[11px] font-normal text-amber-300/70">tú</span>}
    </span>
    <span className="flex-shrink-0 text-xs tabular-nums text-white/60">{value}</span>
  </li>
);

const SectionTitle = ({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) => (
  <div className="mb-3 flex items-baseline justify-between gap-3">
    <h2 className="text-lg font-black tracking-tight text-white">{children}</h2>
    {aside}
  </div>
);

export interface EcoToday {
  kind: RetoKind;
  number: number;
  top: EcoRankRow[];
  players: number;
  /** null = todavía no ha jugado hoy. */
  myScore: number | null;
}

export interface ExamBoards {
  today: DailyDayBoard | null;
  /** El de la segunda tarjeta: ayer, o el día elegido en el calendario. */
  yesterday: DailyDayBoard | null;
  status: DailyExamStatus | null;
}

/** Un botón de la paginación: número de página o flecha. */
const PageButton = ({
  children,
  label,
  current = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  current?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-current={current ? "page" : undefined}
    disabled={disabled}
    onClick={onClick}
    className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-bold tabular-nums transition disabled:opacity-25 ${
      current ? "bg-amber-400 text-slate-950" : "text-white/55 hover:bg-white/5 hover:text-white enabled:hover:bg-white/5"
    }`}
  >
    {children}
  </button>
);

/** El ranking de un día del reto. Hoy y ayer van uno al lado del otro. */
const DayCard = ({
  title,
  board,
  aside,
  empty,
}: {
  title: React.ReactNode;
  board: DailyDayBoard | null;
  aside: React.ReactNode;
  empty: string;
}) => {
  const [page, setPage] = useState(0);
  const rows = board?.top ?? [];
  const pages = Math.max(1, Math.ceil(rows.length / DAY_PAGE));
  const visible = rows.slice(page * DAY_PAGE, (page + 1) * DAY_PAGE);
  // Tu fila, si no está en esta página: separada al final, para encontrarte siempre.
  const mine = rows.find((row) => row.isMe && !visible.includes(row));

  return (
  <div className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-1.5">
    <div className="flex min-h-11 items-center justify-between gap-3 px-3 pb-2 pt-2">
      <div className="flex min-w-0 items-center text-sm font-black text-white">{title}</div>
      {aside}
    </div>
    {!board ? (
      <p className="px-3 py-6 text-center text-xs text-white/45">Ahora mismo no se puede leer.</p>
    ) : rows.length ? (
      <>
        <ol className="border-t border-white/5 pt-1">
          {[...visible, ...(mine ? [mine] : [])].map((row) => (
            <Fragment key={`${row.rank}-${row.name}`}>
              {row === mine && <li aria-hidden className="mx-3 my-1 border-t border-dashed border-white/10" />}
              <Row
                rank={row.rank}
                name={row.name}
                value={`${correctLabel(row.correct, row.total)} · ${durationLabel(row.ms)}`}
                isMe={row.isMe}
              />
            </Fragment>
          ))}
        </ol>
        {pages > 1 && (
          <nav aria-label="Páginas" className="mt-auto flex items-center justify-center gap-1 border-t border-white/5 px-1.5 pt-1.5">
            <PageButton label="Página anterior" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={14} />
            </PageButton>
            {Array.from({ length: pages }, (_, index) => (
              <PageButton
                key={index}
                label={`Página ${index + 1}`}
                current={index === page}
                onClick={() => setPage(index)}
              >
                {index + 1}
              </PageButton>
            ))}
            <PageButton label="Página siguiente" disabled={page === pages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight size={14} />
            </PageButton>
          </nav>
        )}
      </>
    ) : (
      <p className="border-t border-white/5 px-3 py-6 text-center text-xs text-white/45">{empty}</p>
    )}
  </div>
  );
};

const DailyBoards = ({ examen, day, past }: { examen: ExamBoards; day: string; past: string }) => {
  const router = useRouter();
  const [loading, startLoading] = useTransition();
  const yesterdayDay = previousDay(day);
  const isYesterday = past === yesterdayDay;
  // El día elegido va en la dirección (?dia=), así que se puede enlazar y el
  // botón de atrás vuelve al anterior. Ayer es la portada: sin nada detrás.
  const pickDay = (picked: string) =>
    startLoading(() => {
      router.push(picked === yesterdayDay ? "/honor" : `/honor?dia=${picked}`, { scroll: false });
    });
  const status = examen.status;
  const todayAside =
    status?.kind === "done" ? (
      <Link href={DAILY_EXAM.href} className="text-xs text-white/50 hover:text-white">
        Tú:{" "}
        <span className="font-bold text-white/85">
          {correctLabel(status.correct, status.total)} · {durationLabel(status.ms)}
        </span>
      </Link>
    ) : (
      <Link
        href={DAILY_EXAM.href}
        className="rounded-full bg-amber-400 px-3.5 py-1.5 text-[11px] font-black text-slate-950 transition hover:bg-amber-300"
      >
        {status?.kind === "doing" ? "Seguir" : "Hacerlo"}
      </Link>
    );
  const yesterday = examen.yesterday;
  const yesterdayAside = yesterday ? (
    <span className="text-xs text-white/50">
      {yesterday.myRank > 0 ? (
        <>
          Quedaste <span className="font-bold text-white/85">{yesterday.myRank}º</span>
        </>
      ) : (
        "No lo hiciste"
      )}
    </span>
  ) : null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <DayCard
        title="Hoy"
        board={examen.today}
        aside={todayAside}
        empty="Todavía no lo ha acabado nadie. El primer puesto está libre."
      />
      <div className={`grid transition-opacity ${loading ? "pointer-events-none opacity-50" : ""}`}>
        <DayCard
          key={past}
          title={<DayPicker value={past} min={DAILY_EXAM.launch} max={yesterdayDay} onPick={pickDay} />}
          board={yesterday}
          aside={yesterdayAside}
          empty={isYesterday ? "Ayer no lo acabó nadie." : "Ese día no lo acabó nadie."}
        />
      </div>
    </div>
  );
};

/** El relleno de la barra: oro, plata y bronce para los tres primeros puestos. */
const BAR_FILL: Record<number, string> = {
  1: "bg-gradient-to-r from-amber-400/45 to-amber-300/25",
  2: "bg-gradient-to-r from-slate-300/35 to-slate-300/15",
  3: "bg-gradient-to-r from-orange-400/35 to-orange-300/15",
};

/**
 * Una fila del cuadro de medallas: la barra mide las medallas al lado de las
 * del primero, y el nombre va encima. Se lee de un vistazo quién va lejos y
 * quién está a punto de adelantar.
 */
const MedalBar = ({ row, best }: { row: HonorRow; best: number }) => {
  const width = best > 0 ? Math.max(6, (row.medals / best) * 100) : 0;
  return (
    <li className="flex items-center gap-3">
      <span
        className={`w-6 flex-shrink-0 text-right text-sm font-black tabular-nums ${
          row.rank === 1 ? "text-amber-300" : row.rank === 2 ? "text-slate-300" : row.rank === 3 ? "text-orange-300" : "text-white/35"
        }`}
      >
        {row.rank}
      </span>
      <span
        className={`relative flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-lg bg-white/[0.03] ${
          row.isMe ? "ring-1 ring-amber-300/60" : ""
        }`}
      >
        <span
          className={`absolute inset-y-0 left-0 rounded-lg ${BAR_FILL[row.rank] ?? "bg-white/[0.08]"}`}
          style={{ width: `${width}%` }}
        />
        <span
          className={`relative min-w-0 flex-1 truncate px-3 text-sm ${
            row.isMe ? "font-bold text-amber-100" : row.rank <= 3 ? "font-bold text-white" : "text-white/85"
          }`}
        >
          {row.name}
          {row.isMe && <span className="ml-1.5 text-[11px] font-normal text-amber-300/80">tú</span>}
        </span>
        <span className="relative flex-shrink-0 px-3 text-sm font-black tabular-nums text-white/90">{row.medals}</span>
      </span>
    </li>
  );
};

/** Del 11º para abajo: una ficha pequeña, varias por línea. */
const MedalChip = ({ row }: { row: HonorRow }) => (
  <li
    className={`flex min-w-0 items-baseline gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
      row.isMe ? "bg-amber-300/10 ring-1 ring-amber-300/60" : "bg-white/[0.04]"
    }`}
  >
    <span className="flex-shrink-0 font-black tabular-nums text-white/35">{row.rank}</span>
    <span className={`min-w-0 truncate ${row.isMe ? "font-bold text-amber-100" : "text-white/80"}`}>{row.name}</span>
    <span className="flex-shrink-0 font-black tabular-nums text-white/90">{row.medals}</span>
  </li>
);

const MedalBoard = ({ board }: { board: HonorBoard }) => {
  const [shown, setShown] = useState(CHIPS_PAGE);
  const bars = board.rows.slice(0, BARS);
  const chips = board.rows.slice(BARS, BARS + shown);
  const best = board.rows[0]?.medals ?? 0;
  // Tu ficha, si sales pero todavía no se ve.
  const myChipApart =
    board.me?.listed && board.me.rank > 0 && !bars.some((row) => row.isMe) && !chips.some((row) => row.isMe)
      ? board.rows.find((row) => row.isMe)
      : null;

  if (!board.rows.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-10 text-center text-sm text-white/50">
        Todavía no tiene medallas nadie. La primera se saca con un pleno en partida larga.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 sm:p-4">
      <ol className="space-y-1.5">
        {bars.map((row) => (
          <MedalBar key={`${row.rank}-${row.name}`} row={row} best={best} />
        ))}
      </ol>
      {(chips.length > 0 || myChipApart) && (
        <ol className="mt-3 grid grid-cols-2 gap-1.5 border-t border-white/5 pt-3 sm:grid-cols-3">
          {chips.map((row) => (
            <MedalChip key={`${row.rank}-${row.name}`} row={row} />
          ))}
          {myChipApart && <MedalChip row={myChipApart} />}
        </ol>
      )}
      {board.rows.length > BARS + shown && (
        <button
          type="button"
          onClick={() => setShown(shown + CHIPS_PAGE)}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold text-white/45 transition hover:bg-white/5 hover:text-white"
        >
          Ver más
          <ChevronDown size={13} />
        </button>
      )}
    </div>
  );
};

export default function HonorView({
  board,
  examen,
  retos,
  day,
  past,
}: {
  /** El cuadro de medallas; null si está escondido (HONOR_MEDALS_VISIBLE). */
  board: HonorBoard | null;
  /** El reto diario de hoy y de ayer. */
  examen: ExamBoards;
  /** Eco y Pulso de hoy, null si están aparcados; dentro, null el que no se ha podido leer. */
  retos: Record<RetoKind, EcoToday | null> | null;
  /** El día de Madrid, "2026-10-26". */
  day: string;
  /** El día de la segunda tarjeta del reto: ayer, o el elegido. */
  past: string;
}) {
  const me = board?.me;
  let mine: string | null = null;
  if (me) {
    if (me.rank === 0) mine = "Aún sin medallas";
    else if (me.listed) mine = `Vas ${me.rank}º · ${medalsLabel(me.medals)}`;
    else mine = `No sales · irías ${me.rank}º`;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <header>
        <p className="text-sm font-bold capitalize text-amber-300/80">{dayLabel(day)}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">Cuadro de honor</h1>
      </header>

      {/* Primero lo de cada día; debajo, lo de siempre. */}
      <section>
        <SectionTitle>{DAILY_EXAM.name}</SectionTitle>
        <DailyBoards examen={examen} day={day} past={past} />
        <p className="mt-3 text-xs leading-5 text-white/40">
          Más aciertos primero; a igualdad, quien tardó menos. Cambia a medianoche.
        </p>
      </section>

      {retos && (
        <section>
          <SectionTitle>Retos de hoy</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {RETO_KINDS.map((kind) => {
              const eco = retos[kind];
              const played = eco?.myScore !== null && eco?.myScore !== undefined;
              return (
                <div key={kind} className="rounded-2xl border border-white/10 bg-slate-950/70 p-1.5">
                  <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-2">
                    <p className="text-sm font-black text-white">
                      {RETOS[kind].name}
                      {eco && <span className="ml-1.5 text-xs font-normal tabular-nums text-white/35">#{eco.number}</span>}
                    </p>
                    {played ? (
                      <Link href={`/reto/${kind}`} className="text-[11px] text-white/45 hover:text-white">
                        Tú: <span className="font-bold text-white/80">{scoreLabel(kind, eco!.myScore!)}</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/reto/${kind}`}
                        className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-slate-950 transition hover:bg-amber-300"
                      >
                        Jugar
                      </Link>
                    )}
                  </div>
                  {!eco ? (
                    <p className="px-3 py-5 text-center text-xs text-white/45">Ahora mismo no se puede leer.</p>
                  ) : eco.top.length ? (
                    <ol className="border-t border-white/5 pt-1">
                      {eco.top.map((row) => (
                        <Row
                          key={`${row.rank}-${row.name}`}
                          rank={row.rank}
                          name={row.name}
                          value={scoreLabel(kind, row.score)}
                          isMe={row.isMe}
                        />
                      ))}
                    </ol>
                  ) : (
                    <p className="border-t border-white/5 px-3 py-5 text-center text-xs text-white/45">
                      Hoy todavía no ha jugado nadie.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {board && (
        <section>
          <SectionTitle aside={mine && <p className="text-xs text-white/50">{mine}</p>}>Medallas</SectionTitle>
          <MedalBoard board={board} />
          <p className="mt-3 text-xs leading-5 text-white/40">
            Una medalla por cada nivel acabado sin fallos en partida larga. Sales con tu nombre; puedes quitarte desde
            tu menú de usuario.
          </p>
        </section>
      )}
    </div>
  );
}
