import Link from "next/link";
import { Trophy } from "lucide-react";
import type { HonorBoard, HonorRow, HonorSort, HonorTable } from "@/lib/honor";

/** El color del puesto: oro, plata y bronce. */
const RANK_COLOR: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-orange-300",
};

/** Cuántos salen por columna en la portada. El cuadro entero está en /honor. */
const STRIP_PODIUM = 3;

const LABEL: Record<HonorSort, (row: HonorRow) => string> = {
  medallas: (row) => String(row.medals),
  dias: (row) => `${row.days} de 7`,
  racha: (row) => `${row.streak} ${row.streak === 1 ? "día" : "días"}`,
};

const Row = ({ row, sort, first }: { row: HonorRow; sort: HonorSort; first: boolean }) => (
  <li
    // En el móvil, cada columna enseña solo al primero (y a ti, si estás):
    // tres columnas apiladas con tres filas cada una se comían la portada.
    className={`-mx-2 items-center gap-3 rounded-lg px-2 py-1 ${
      first || row.isMe ? "flex" : "hidden md:flex"
    } ${row.isMe ? "bg-amber-400/15" : ""}`}
  >
    <span
      className={`w-3 flex-shrink-0 text-xs font-black tabular-nums ${
        RANK_COLOR[row.rank] ?? "text-white/50"
      }`}
    >
      {row.rank}
    </span>
    <span
      className={`min-w-0 flex-1 truncate text-sm ${
        row.rank === 1 || row.isMe ? "font-bold text-white" : "text-white/80"
      }`}
    >
      {row.isMe ? "Tú" : row.name}
    </span>
    <span className="flex-shrink-0 text-sm tabular-nums text-white/80">{LABEL[sort](row)}</span>
  </li>
);

const Column = ({ title, table, sort }: { title: string; table: HonorTable; sort: HonorSort }) => {
  const rows = table.rows.slice(0, STRIP_PODIUM);
  // Tu cifra, si sales en el cuadro pero no en estas tres filas.
  const mine =
    table.me?.listed && table.me.row.rank > 0 && !rows.some((row) => row.isMe)
      ? table.me.row
      : null;

  return (
    <div className="py-2.5 md:px-5 md:py-0 md:first:pl-0 md:last:pr-0">
      <h3 className="mb-1.5 text-[11px] font-bold text-white/70">{title}</h3>
      {rows.length ? (
        <ol className="space-y-0.5">
          {rows.map((row, index) => (
            <Row key={`${row.rank}-${row.name}`} row={row} sort={sort} first={index === 0} />
          ))}
        </ol>
      ) : (
        <p className="py-1 text-xs text-white/40">Nadie todavía.</p>
      )}
      {mine && <p className="mt-1.5 text-[10px] text-white/55">Tú: {LABEL[sort](mine)}</p>}
    </div>
  );
};

/**
 * El cuadro de honor en pequeño, para la portada: el podio de la semana en
 * tres cosas, y el enlace al cuadro entero (/honor), que es donde van las
 * familias y el "desde siempre".
 *
 * Va arriba y no al final porque al final de la portada no llega nadie.
 * Solo semana: así cada lunes que pasa hay sitio para alguien nuevo, y no se
 * mezclan periodos en la misma franja sin decirlo.
 */
export default function HonorStrip({
  board,
  showInHonor,
}: {
  board: HonorBoard;
  /** Si quien mira ya sale en el cuadro. Si no, se le dice que puede. */
  showInHonor: boolean;
}) {
  const week = board.tables.semana.todo;

  return (
    <section className="mb-7 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 shadow-lg md:px-5 md:py-4">
      <div className="flex items-center gap-2.5">
        <Trophy size={14} className="flex-shrink-0 text-amber-300" strokeWidth={2} />
        <h2 className="min-w-0 flex-1 truncate text-sm font-black text-white">
          Cuadro de honor <span className="font-normal text-white/50">· esta semana</span>
        </h2>
        <Link
          href="/honor"
          className="flex-shrink-0 text-xs font-bold text-amber-300 transition-colors hover:text-amber-200"
        >
          Ver todo →
        </Link>
      </div>

      <div className="mt-2 grid divide-y divide-white/10 md:mt-3 md:grid-cols-3 md:divide-x md:divide-y-0">
        <Column title="Medallas ganadas" table={week.medallas} sort="medallas" />
        <Column title="Días practicados" table={week.dias} sort="dias" />
        <Column title="Racha actual" table={week.racha} sort="racha" />
      </div>

      {!showInHonor && (
        <p className="mt-2.5 border-t border-white/10 pt-2.5 text-[11px] text-white/55">
          Tú no sales en el cuadro.{" "}
          <Link href="/honor" className="font-bold text-amber-300 hover:text-amber-200">
            Actívalo si quieres salir
          </Link>
        </p>
      )}
    </section>
  );
}
