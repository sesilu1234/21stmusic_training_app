"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
// Solo tipos: lib/honor.ts y lib/ecoDb.ts son de servidor.
import type { HonorBoard } from "@/lib/honor";
import type { EcoRankRow } from "@/lib/ecoDb";
import { RETOS, RETO_KINDS, scoreLabel, type RetoKind } from "@/lib/reto";

/** Cuántos se ven de entrada, y cuántos más con cada "Ver más". */
const PAGE = 10;

/** El color del puesto: oro, plata y bronce. */
const RANK_COLOR: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-orange-300",
};

const medalsLabel = (count: number) => `${count} ${count === 1 ? "medalla" : "medallas"}`;

/** "lunes 26 de octubre", del día de Madrid que manda el servidor (sin hora: no depende del navegador). */
const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${day}T12:00:00Z`),
  );

const Row = ({ rank, name, value, isMe }: { rank: number; name: string; value: string; isMe: boolean }) => (
  <li
    className={`flex items-baseline gap-3 px-3 py-2 ${
      isMe ? "rounded-lg bg-amber-300/10" : ""
    }`}
  >
    <span className={`w-5 flex-shrink-0 text-xs font-black tabular-nums ${RANK_COLOR[rank] ?? "text-white/35"}`}>
      {rank}
    </span>
    <span className={`min-w-0 flex-1 truncate text-sm ${isMe ? "font-bold text-amber-100" : "text-white/85"}`}>
      {name}
      {isMe && <span className="ml-1.5 text-[10px] font-normal text-amber-300/70">tú</span>}
    </span>
    <span className="flex-shrink-0 text-xs tabular-nums text-white/55">{value}</span>
  </li>
);

export interface EcoToday {
  kind: RetoKind;
  number: number;
  top: EcoRankRow[];
  players: number;
  /** null = todavía no ha jugado hoy. */
  myScore: number | null;
}

export default function HonorView({
  board,
  retos,
  day,
}: {
  board: HonorBoard;
  /** Cada reto de hoy; null el que no se ha podido leer. */
  retos: Record<RetoKind, EcoToday | null>;
  /** El día de Madrid, "2026-10-26". */
  day: string;
}) {
  const [shown, setShown] = useState(PAGE);
  const rows = board.rows.slice(0, shown);
  const me = board.me;
  // Tu fila, si sales pero no entre las que se ven.
  const myRowApart =
    me?.listed && me.rank > 0 && !rows.some((row) => row.isMe) ? board.rows.find((row) => row.isMe) : null;

  let mine: string | null = null;
  if (me) {
    if (me.rank === 0) mine = "Aún sin medallas";
    else if (me.listed) mine = `Vas ${me.rank}º`;
    else mine = `No sales · irías ${me.rank}º`;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300/70">{dayLabel(day)}</p>
        <h1 className="mt-1 text-3xl font-black italic tracking-tight md:text-4xl">Cuadro de honor</h1>
      </header>

      {/* Primero lo de hoy, que cambia cada día; debajo, lo de siempre. */}
      <section>
        <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-white/75">Retos de hoy</h2>
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
                      className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-amber-300"
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

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-white/75">Medallas</h2>
          {mine && (
            <p className="text-[11px] text-white/45">
              {mine}
              {me && me.rank > 0 && <span className="text-white/30"> · {medalsLabel(me.medals)}</span>}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-1.5">
          {rows.length ? (
            <>
              <ol>
                  {rows.map((row) => (
                    <Row
                      key={`${row.rank}-${row.name}`}
                      rank={row.rank}
                      name={row.name}
                      value={medalsLabel(row.medals)}
                      isMe={row.isMe}
                    />
                  ))}
                  {myRowApart && (
                    <>
                      <li aria-hidden className="mx-3 my-1 border-t border-dashed border-white/10" />
                      <Row rank={myRowApart.rank} name={myRowApart.name} value={medalsLabel(myRowApart.medals)} isMe />
                    </>
                  )}
              </ol>
              {board.rows.length > shown && (
                <button
                  type="button"
                  onClick={() => setShown(shown + PAGE)}
                  className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold text-white/45 transition hover:bg-white/5 hover:text-white"
                >
                  Ver más
                  <ChevronDown size={13} />
                </button>
              )}
            </>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-white/45">
              Todavía no tiene medallas nadie. La primera se saca con un pleno en partida larga.
            </p>
          )}
        </div>
        <p className="mt-3 text-[11px] leading-5 text-white/35">
          Una medalla por cada nivel acabado sin fallos en partida larga. Sales con tu nombre; puedes quitarte desde
          tu menú de usuario.
        </p>
      </section>
    </div>
  );
}
