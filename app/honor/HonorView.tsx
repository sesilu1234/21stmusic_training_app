"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import HonorToggle from "./HonorToggle";
// Solo tipos: lib/honor.ts es de servidor y no puede entrar en el bundle.
import type {
  HonorBoard,
  HonorFamily,
  HonorMe,
  HonorRow,
  HonorScope,
  HonorSort,
  HonorTable,
} from "@/lib/honor";

const SORTS: HonorSort[] = ["medallas", "dias", "racha"];

/** El color del puesto: oro, plata y bronce. */
const RANK_COLOR: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-orange-300",
};

const count = (value: number, one: string, many: string) =>
  `${value} ${value === 1 ? one : many}`;

const valueOf = (row: HonorRow, sort: HonorSort) =>
  sort === "medallas" ? row.medals : sort === "dias" ? row.days : row.streak;

const columnTitle = (sort: HonorSort, scope: HonorScope) =>
  sort === "medallas" ? "Medallas" : sort === "dias" ? "Días" : scope === "siempre" ? "Mejor racha" : "Racha";

/** "4º en ___". */
const sortWord = (sort: HonorSort, scope: HonorScope) =>
  sort === "medallas" ? "medallas" : sort === "dias" ? "días" : scope === "siempre" ? "mejor racha" : "racha";

/** La cifra de una celda. */
const cell = (row: HonorRow, sort: HonorSort, scope: HonorScope) => {
  if (sort === "medallas") return String(row.medals);
  if (sort === "dias") return scope === "semana" ? `${row.days} de 7` : count(row.days, "día", "días");
  return count(row.streak, "día", "días");
};

/** La cifra contada en una frase: "11 medallas", "ha practicado 6 de 7 días". */
const phrase = (row: HonorRow, sort: HonorSort, scope: HonorScope) => {
  if (sort === "medallas") return count(row.medals, "medalla", "medallas");
  if (sort === "dias")
    return scope === "semana"
      ? `ha practicado ${row.days} de 7 días`
      : `${count(row.days, "día", "días")} practicando`;
  return scope === "semana"
    ? `racha de ${count(row.streak, "día", "días")}`
    : `mejor racha de ${count(row.streak, "día", "días")}`;
};

const gapText = (gap: number, sort: HonorSort) =>
  sort === "medallas" ? count(gap, "medalla", "medallas") : count(gap, "día", "días");

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

const LeaderCard = ({
  table,
  sort,
  scope,
  familyLabel,
  viewerName,
}: {
  table: HonorTable;
  sort: HonorSort;
  scope: HonorScope;
  familyLabel: string | null;
  viewerName: string;
}) => {
  const leaders = table.rows.filter((row) => row.rank === 1);
  const where = `${scope === "semana" ? "la semana" : "desde siempre"}${familyLabel ? ` en ${familyLabel}` : ""}`;

  if (!leaders.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-lg">
        <p className="text-xs text-white/50">Nadie en cabeza todavía</p>
        <p className="mt-1 text-sm text-white/70">El primero que sume algo aquí se pone delante.</p>
      </div>
    );
  }

  const first = leaders[0];
  const shown = (row: HonorRow) => (row.isMe ? "Tú" : row.name);
  const names =
    leaders.length === 1
      ? shown(first)
      : leaders.length === 2
        ? `${shown(leaders[0])} y ${shown(leaders[1])}`
        : `${shown(leaders[0])} y ${leaders.length - 1} más`;
  const label =
    leaders.length > 1
      ? `Lideran ${where}`
      : first.isMe
        ? `Lideras ${where}`
        : `Lidera ${where}`;
  const other: HonorSort = sort === "medallas" ? "dias" : "medallas";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-lg">
      <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full bg-amber-300 text-lg font-black text-amber-950">
        {initials(first.isMe ? viewerName : first.name)}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-white/60">{label}</p>
        <p className="truncate text-2xl font-black tracking-tight text-amber-300 md:text-3xl">{names}</p>
        <p className="mt-0.5 text-xs text-white/70">
          {leaders.length > 1
            ? `${phrase(first, sort, scope)} cada uno`
            : `${phrase(first, sort, scope)} · ${phrase(first, other, scope)}`}
        </p>
      </div>
    </div>
  );
};

const MeCard = ({
  me,
  table,
  sort,
  scope,
}: {
  me: HonorMe;
  table: HonorTable;
  sort: HonorSort;
  scope: HonorScope;
}) => {
  const { rank } = me.row;
  const word = sortWord(sort, scope);

  let headline: string;
  let detail: string;
  if (rank === 0) {
    headline = "Todavía sin puesto";
    detail = me.listed
      ? "En cuanto sumes algo aquí, apareces en la tabla."
      : "No sales en el cuadro: esto solo lo ves tú.";
  } else if (!me.listed) {
    headline = `Irías ${rank}º en ${word}`;
    detail = "No sales en el cuadro: esto solo lo ves tú.";
  } else if (rank === 1) {
    const tied = table.rows.some((row) => row.rank === 1 && !row.isMe);
    headline = `1º en ${word}`;
    detail = tied
      ? "Compartes el primer puesto."
      : me.behind
        ? `Le sacas ${gapText(me.behind.gap, sort)} a ${me.behind.name}.`
        : "Nadie te sigue de cerca.";
  } else {
    headline = `${rank}º en ${word}`;
    const ahead = me.ahead;
    detail = ahead
      ? `Te ${ahead.gap === 1 ? "falta" : "faltan"} ${gapText(ahead.gap, sort)} para ${
          ahead.name ? `alcanzar a ${ahead.name}` : `el ${ahead.rank}º puesto`
        }.`
      : "";
  }

  return (
    <div className="rounded-2xl border border-amber-200/25 bg-amber-300/15 p-5 shadow-lg">
      <p className="text-xs text-white/70">{scope === "semana" ? "Tu semana" : "Tu puesto"}</p>
      <p className="mt-1 text-xl font-black tracking-tight text-white">{headline}</p>
      {detail && <p className="mt-1 text-xs text-white/75">{detail}</p>}
    </div>
  );
};

/** Una fila de la tabla. La rejilla es la misma para cabecera y filas. */
const GRID =
  "grid grid-cols-[1.25rem_minmax(0,1fr)_repeat(3,3.75rem)] items-center gap-2 px-3 sm:grid-cols-[2rem_minmax(0,1fr)_repeat(3,8rem)] sm:gap-3 sm:px-4";

const TableRow = ({
  row,
  sort,
  scope,
  max,
}: {
  row: HonorRow;
  sort: HonorSort;
  scope: HonorScope;
  max: number;
}) => (
  <li
    className={`${GRID} rounded-xl py-2.5 ${row.isMe ? "bg-amber-300/10 ring-1 ring-amber-300/25" : ""}`}
  >
    <span className={`text-sm font-black tabular-nums ${RANK_COLOR[row.rank] ?? "text-white/50"}`}>
      {row.rank}
    </span>
    <span className="truncate text-sm font-bold text-white">{row.isMe ? "Tú" : row.name}</span>
    {SORTS.map((key) =>
      key === sort ? (
        <span key={key} className="flex items-center gap-2">
          <span
            aria-hidden
            className={`hidden h-1.5 rounded-full sm:block ${row.rank === 1 ? "bg-amber-300" : "bg-amber-300/50"}`}
            style={{ width: `${Math.max(8, (valueOf(row, key) / max) * 45)}%` }}
          />
          <span className="flex-shrink-0 text-sm font-black tabular-nums text-white">
            {cell(row, key, scope)}
          </span>
        </span>
      ) : (
        <span key={key} className="text-sm tabular-nums text-white/60">
          {cell(row, key, scope)}
        </span>
      ),
    )}
  </li>
);

const Segmented = ({
  scope,
  onChange,
}: {
  scope: HonorScope;
  onChange: (scope: HonorScope) => void;
}) => (
  <div className="flex flex-shrink-0 rounded-xl border border-white/10 bg-slate-950/70 p-1">
    {(
      [
        ["semana", "Esta semana"],
        ["siempre", "Desde siempre"],
      ] as const
    ).map(([id, label]) => (
      <button
        key={id}
        type="button"
        aria-pressed={scope === id}
        onClick={() => onChange(id)}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
          scope === id ? "bg-amber-300 text-amber-950" : "text-white/75 hover:text-white"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

export default function HonorView({
  board,
  families,
  weekLabel,
  viewerName,
  showInHonor,
}: {
  board: HonorBoard;
  families: { id: HonorFamily; label: string }[];
  /** "Del 10 al 16 de octubre". */
  weekLabel: string;
  /** Como sale en el cuadro: "Ulises P.". */
  viewerName: string;
  showInHonor: boolean;
}) {
  const [scope, setScope] = useState<HonorScope>("semana");
  const [family, setFamily] = useState<HonorFamily>("todo");
  const [sort, setSort] = useState<HonorSort>("medallas");

  const table = board.tables[scope][family][sort];
  const familyLabel = family === "todo" ? null : (families.find((f) => f.id === family)?.label ?? null);
  const max = Math.max(1, ...table.rows.map((row) => valueOf(row, sort)));
  // Fuera de los cinco, tu fila solo la ves tú, debajo y aparte.
  const myRowApart =
    table.me?.listed && table.me.row.rank > 0 && !table.rows.some((row) => row.isMe)
      ? table.me.row
      : null;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black italic tracking-tight md:text-4xl">Cuadro de honor</h1>
          <p className="mt-1.5 text-xs text-white/70">
            {scope === "semana" ? `${weekLabel} · ` : ""}
            {count(board.participants, "alumno participa", "alumnos participan")}
          </p>
        </div>
        <Segmented scope={scope} onChange={setScope} />
      </header>

      <div className={`mt-6 grid gap-3.5 ${table.me ? "md:grid-cols-[1.6fr_1fr]" : ""}`}>
        <LeaderCard
          table={table}
          sort={sort}
          scope={scope}
          familyLabel={familyLabel}
          viewerName={viewerName}
        />
        {table.me && <MeCard me={table.me} table={table} sort={sort} scope={scope} />}
      </div>

      <section className="mt-3.5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-lg">
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2">
          {families.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={family === entry.id}
              onClick={() => setFamily(entry.id)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                family === entry.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className={`${GRID} border-b border-white/5 py-2.5 text-[11px] text-white/50`}>
          <span>#</span>
          <span>Alumno</span>
          {SORTS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={`flex items-center gap-0.5 text-left transition-colors ${
                sort === key ? "font-bold text-amber-300" : "hover:text-white"
              }`}
            >
              {columnTitle(key, scope)}
              {sort === key && <ChevronDown size={12} strokeWidth={2.5} className="flex-shrink-0" />}
            </button>
          ))}
        </div>

        {table.rows.length ? (
          <ol className="space-y-0.5 p-1.5">
            {table.rows.map((row) => (
              <TableRow key={`${row.rank}-${row.name}`} row={row} sort={sort} scope={scope} max={max} />
            ))}
            {myRowApart && (
              <>
                <li aria-hidden className="mx-3 border-t border-dashed border-white/10" />
                <TableRow row={myRowApart} sort={sort} scope={scope} max={max} />
              </>
            )}
          </ol>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-white/50">
            {scope === "semana" ? "Esta semana todavía no hay nadie aquí." : "Todavía no hay nadie aquí."}
          </p>
        )}
      </section>

      <footer className="mt-4">
        <HonorToggle initial={showInHonor} name={viewerName} />
      </footer>
    </div>
  );
}
