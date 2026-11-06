import Link from "next/link";
import { correctLabel, durationLabel, type DailyDayBoard, type DailyRankRow } from "@/lib/retoExamen";

/** Oro, plata y bronce: el disco del puesto. */
const PLACE_STYLE: Record<number, string> = {
  1: "bg-amber-300 text-amber-950",
  2: "bg-slate-300 text-slate-900",
  3: "bg-orange-300 text-orange-950",
};

/** Cuántos se ven en la portada; el resto, en /honor. */
const SHOWN = 5;

const RankRow = ({ row, listed }: { row: DailyRankRow; listed: boolean }) => (
  <li className={`flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs ${row.isMe ? "bg-amber-300/10" : ""}`}>
    <span
      className={`grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-full text-[10px] font-black tabular-nums ${
        PLACE_STYLE[row.rank] ?? "bg-white/10 text-white/60"
      }`}
    >
      {row.rank}
    </span>
    <span className={`min-w-0 flex-1 truncate ${row.isMe ? "font-bold text-amber-100" : "text-white/85"}`}>
      {row.isMe ? (listed ? "Tú" : "Tú (no sales)") : row.name}
    </span>
    <span className="flex-shrink-0 font-bold tabular-nums text-white/80">{correctLabel(row.correct, row.total)}</span>
    <span className="hidden w-9 flex-shrink-0 text-right tabular-nums text-white/40 sm:inline">{durationLabel(row.ms)}</span>
  </li>
);

/**
 * El ranking de un día del reto, en la portada, al lado de la tarjeta del
 * reto. Van dos en esa media fila: el de hoy pica a hacerlo, y el de ayer se
 * queda a la vista todo el día siguiente (quien lo hizo a las diez de la
 * noche también sale).
 */
export default function HonorStrip({
  board,
  title,
  empty,
  listed,
}: {
  board: DailyDayBoard | null;
  title: string;
  /** Qué decir si ese día no lo acabó nadie. */
  empty: string;
  /** false = se ha quitado del cuadro: el puesto es el que tendría. */
  listed: boolean;
}) {
  const rows = board?.top.slice(0, SHOWN) ?? [];
  // Tu fila, si estás pero no entre los que se ven.
  const mine = board?.top.find((row) => row.isMe && !rows.includes(row));
  const place = board && board.myRank > 0 ? `${listed ? "" : "irías "}${board.myRank}º` : null;

  return (
    <Link
      href="/honor"
      className="group flex min-w-0 flex-col rounded-2xl border border-white/10 bg-slate-950/70 px-2 py-2.5 shadow-lg transition hover:border-amber-300/40"
    >
      <span className="flex items-baseline justify-between gap-3 px-1.5">
        <span className="truncate text-sm font-black tracking-tight text-white">{title}</span>
        <span className="flex-shrink-0 text-[11px] font-bold text-amber-300 transition-colors group-hover:text-amber-200">
          {place ?? (board && board.players > 0 ? `${board.players} ${board.players === 1 ? "jugador" : "jugadores"}` : "")}
        </span>
      </span>

      {rows.length ? (
        <ol className="mt-1.5 space-y-0.5">
          {rows.map((row) => (
            <RankRow key={`${row.rank}-${row.name}`} row={row} listed={listed} />
          ))}
          {mine && (
            <>
              <li aria-hidden className="mx-1.5 border-t border-dashed border-white/10" />
              <RankRow row={mine} listed={listed} />
            </>
          )}
        </ol>
      ) : (
        <span className="mt-1.5 block px-1.5 text-[11px] leading-4 text-white/50">{board ? empty : "Ahora mismo no se puede leer."}</span>
      )}
    </Link>
  );
}
