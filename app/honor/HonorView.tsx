"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
// Solo tipos: lib/honor.ts y lib/ecoDb.ts son de servidor.
import type { HonorBoard, HonorRow } from "@/lib/honor";
import type { EcoRankRow } from "@/lib/ecoDb";
import { RETOS, RETO_KINDS, scoreLabel, type RetoKind } from "@/lib/reto";

/** Cuántos se ven de entrada, y cuántos más con cada "Mostrar más". */
const PAGE = 10;

/** El color del puesto: oro, plata y bronce. */
const RANK_COLOR: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-orange-300",
};

const medalsLabel = (count: number) => `${count} ${count === 1 ? "medalla" : "medallas"}`;

const Row = ({ rank, name, value, isMe }: { rank: number; name: string; value: string; isMe: boolean }) => (
  <li className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isMe ? "bg-amber-300/10 ring-1 ring-amber-300/25" : ""}`}>
    <span className={`w-6 flex-shrink-0 text-sm font-black tabular-nums ${RANK_COLOR[rank] ?? "text-white/50"}`}>
      {rank}
    </span>
    <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{isMe ? `${name} (tú)` : name}</span>
    <span className="flex-shrink-0 text-sm tabular-nums text-white/80">{value}</span>
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
}: {
  board: HonorBoard;
  /** Cada reto de hoy; null el que no se ha podido leer. */
  retos: Record<RetoKind, EcoToday | null>;
}) {
  const [shown, setShown] = useState(PAGE);
  const rows: HonorRow[] = board.rows.slice(0, shown);
  const me = board.me;
  // Tu fila, si sales pero no entre las que se ven.
  const myRowApart = me?.listed && me.rank > 0 && !rows.some((row) => row.isMe) ? board.rows.find((row) => row.isMe) : null;

  let headline: string | null = null;
  if (me) {
    if (me.rank === 0) headline = "Todavía sin medallas: la primera te pone en el cuadro.";
    else if (me.listed) headline = `Vas ${me.rank}º con ${medalsLabel(me.medals)}.`;
    else headline = `No sales en el cuadro. Irías ${me.rank}º con ${medalsLabel(me.medals)}.`;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header>
        <h1 className="text-3xl font-black italic tracking-tight md:text-4xl">Cuadro de honor</h1>
        <p className="mt-1.5 text-xs text-white/70">Medallas ganadas desde siempre.</p>
      </header>

      {headline && (
        <div className="rounded-2xl border border-amber-200/25 bg-amber-300/15 px-5 py-4 text-sm font-bold text-white">
          {headline}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-lg">
        {rows.length ? (
          <ol className="space-y-0.5 p-1.5">
            {rows.map((row) => (
              <Row key={`${row.rank}-${row.name}`} rank={row.rank} name={row.name} value={medalsLabel(row.medals)} isMe={row.isMe} />
            ))}
            {myRowApart && (
              <>
                <li aria-hidden className="mx-3 border-t border-dashed border-white/10" />
                <Row rank={myRowApart.rank} name={myRowApart.name} value={medalsLabel(myRowApart.medals)} isMe />
              </>
            )}
          </ol>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-white/50">Todavía no tiene medallas nadie.</p>
        )}
        {board.rows.length > shown && (
          <button
            type="button"
            onClick={() => setShown(shown + PAGE)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-white/10 py-3 text-xs font-bold text-amber-300 transition hover:bg-white/5 hover:text-amber-200"
          >
            Mostrar más
            <ChevronDown size={14} />
          </button>
        )}
      </section>

      <div className="grid gap-3.5 md:grid-cols-2">
        {RETO_KINDS.map((kind) => {
          const eco = retos[kind];
          return (
            <section key={kind} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-lg">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <h2 className="text-sm font-black text-white">
                  {RETOS[kind].symbol} {RETOS[kind].name} de hoy
                  {eco && <span className="font-normal text-white/45"> · #{eco.number}</span>}
                </h2>
                <Link href={`/reto/${kind}`} className="text-xs font-bold text-amber-300 hover:text-amber-200">
                  {eco?.myScore === null ? "Jugar →" : "Ver →"}
                </Link>
              </div>
              {!eco ? (
                <p className="px-4 py-6 text-center text-sm text-white/50">Ahora mismo no se puede leer.</p>
              ) : eco.top.length ? (
                <ol className="space-y-0.5 p-1.5">
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
                <p className="px-4 py-6 text-center text-sm text-white/50">Hoy todavía no ha jugado nadie.</p>
              )}
            </section>
          );
        })}
      </div>

      <p className="text-xs text-white/50">
        Sales con tu nombre completo. Si prefieres no salir en ningún ranking, quítalo en el menú de tu usuario
        (arriba a la derecha).
      </p>
    </div>
  );
}
