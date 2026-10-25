"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Lock, X } from "lucide-react";
import { closeExamAction } from "./actions";

export interface ResultAnswer {
  summary: string;
  given: string;
  solution: string;
  correct: boolean;
  timedOut: boolean;
}

export interface ResultRow {
  id: string;
  name: string;
  /** "7,5". */
  grade: string;
  correct: number;
  total: number;
  /** "24 oct 2026". */
  date: string;
  answers: ResultAnswer[];
}

export interface QuestionStat {
  summary: string;
  solution: string;
  answered: number;
  /** De 0 a 100, o null si no la ha contestado nadie. */
  percent: number | null;
}

export const CloseButton = ({ id }: { id: string }) => {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("¿Cerrar el examen? Nadie más podrá empezarlo, y no se puede volver a abrir.")) return;
          setError(null);
          startTransition(async () => {
            const result = await closeExamAction(id);
            if (!result.ok) setError(result.error);
          });
        }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-2.5 text-xs font-black text-rose-100 transition hover:border-rose-300/60 disabled:opacity-50"
      >
        <Lock size={14} />
        {pending ? "Cerrando…" : "Cerrar"}
      </button>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  );
};

const AnswerList = ({ answers }: { answers: ResultAnswer[] }) => (
  <ol className="space-y-1.5 border-t border-white/10 px-3 pb-3 pt-3">
    {answers.map((answer, index) => (
      <li
        key={index}
        className={`flex gap-2.5 rounded-xl border px-3 py-2 text-xs ${
          answer.correct
            ? "border-emerald-400/30 bg-emerald-500/10"
            : "border-rose-400/30 bg-rose-500/10"
        }`}
      >
        <span className={`mt-0.5 flex-shrink-0 ${answer.correct ? "text-emerald-300" : "text-rose-300"}`}>
          {answer.correct ? <Check size={14} /> : <X size={14} />}
        </span>
        <span className="min-w-0">
          <span className="block text-white/80">
            {index + 1}. {answer.summary}
          </span>
          <span className="mt-0.5 block text-white/60">
            Contestó: <span className="font-bold text-white">{answer.timedOut ? "se le acabó el tiempo" : answer.given}</span>
            {!answer.correct && (
              <>
                {" · "}Era: <span className="font-bold text-emerald-200">{answer.solution}</span>
              </>
            )}
          </span>
        </span>
      </li>
    ))}
  </ol>
);

export default function ExamResults({ rows, stats }: { rows: ResultRow[]; stats: QuestionStat[] }) {
  const [tab, setTab] = useState<"alumnos" | "preguntas">("alumnos");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
      <div className="flex gap-1 border-b border-white/10 p-2">
        {(
          [
            ["alumnos", `Resultados (${rows.length})`],
            ["preguntas", "Preguntas"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === id ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "alumnos" ? (
        rows.length ? (
          <ul className="divide-y divide-white/5">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setOpen(open === row.id ? null : row.id)}
                  aria-expanded={open === row.id}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white">{row.name}</span>
                    <span className="block text-[11px] text-white/50">
                      {row.correct} de {row.total} · {row.date}
                    </span>
                  </span>
                  <span className="text-lg font-black tabular-nums text-amber-300">{row.grade}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-white/40 transition-transform ${open === row.id ? "rotate-180" : ""}`}
                  />
                </button>
                {open === row.id && <AnswerList answers={row.answers} />}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-white/50">Todavía no lo ha entregado nadie.</p>
        )
      ) : (
        <ol className="divide-y divide-white/5">
          {stats.map((stat, index) => (
            <li key={index} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 flex-shrink-0 text-xs font-black tabular-nums text-white/40">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-white/85">{stat.summary}</span>
                <span className="block text-[11px] text-white/50">
                  Respuesta: <span className="font-bold text-white/75">{stat.solution}</span>
                  {stat.answered > 0 && ` · ${stat.answered} ${stat.answered === 1 ? "respuesta" : "respuestas"}`}
                </span>
              </span>
              <span
                className={`flex-shrink-0 text-sm font-black tabular-nums ${
                  stat.percent === null
                    ? "text-white/30"
                    : stat.percent >= 70
                      ? "text-emerald-300"
                      : stat.percent >= 40
                        ? "text-amber-300"
                        : "text-rose-300"
                }`}
              >
                {stat.percent === null ? "—" : `${stat.percent}%`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
