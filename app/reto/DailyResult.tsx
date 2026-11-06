"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Share2, Trophy, X } from "lucide-react";
import { DAILY_EXAM, correctLabel, durationLabel, type DailyRankRow } from "@/lib/retoExamen";
import { bemol } from "@/lib/bemol";

const two = (value: number) => String(value).padStart(2, "0");

const Countdown = ({ to }: { to: string }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const left = Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000));
  if (left === 0) {
    return (
      <button type="button" onClick={() => window.location.reload()} className="font-bold text-amber-300 underline">
        Ya hay reto nuevo
      </button>
    );
  }
  return (
    <span className="font-mono font-black tabular-nums text-white">
      {two(Math.floor(left / 3600))}:{two(Math.floor((left % 3600) / 60))}:{two(left % 60)}
    </span>
  );
};

const primary =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-amber-300";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/60 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80 transition hover:border-white/30 hover:text-white";

export interface ReviewItem {
  title: string;
  summary: string;
  given: string;
  solution: string;
  correct: boolean;
  /** La sección del reto; los de antes de las secciones no la llevan. */
  section?: string;
}

/** Aciertos por sección, en el orden en que salen. */
const sectionScores = (review: ReviewItem[]) => {
  const scores: { name: string; correct: number; total: number }[] = [];
  review.forEach((item) => {
    if (!item.section) return;
    let entry = scores.find((score) => score.name === item.section);
    if (!entry) {
      entry = { name: item.section, correct: 0, total: 0 };
      scores.push(entry);
    }
    entry.total++;
    if (item.correct) entry.correct++;
  });
  return scores;
};

/** El resultado del examen del día: nota, puesto, top 10 y la corrección. */
export default function DailyResult({
  number,
  correct,
  total,
  ms,
  rank,
  listed,
  players,
  top,
  nextAt,
  review,
}: {
  number: number;
  correct: number;
  total: number;
  ms: number;
  /** 0 = sin puesto. */
  rank: number;
  /** false = se ha quitado del cuadro: el puesto es el que tendría. */
  listed: boolean;
  players: number;
  top: DailyRankRow[];
  nextAt: string;
  review: ReviewItem[];
}) {
  const [shared, setShared] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const text = `🎯 ${DAILY_EXAM.name} #${number} · ${correctLabel(correct, total)} en ${durationLabel(ms)}`;
  const place = rank > 0 ? `${listed ? "" : "irías "}${rank}º de hoy` : null;
  const sections = sectionScores(review);

  const share = async () => {
    const url = `${window.location.origin}/reto`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared("Copiado");
    } catch {
      // Cancelado al compartir: no pasa nada.
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 text-center shadow-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
          {DAILY_EXAM.name} #{number}
        </p>
        <p className="mt-3 text-5xl font-black tabular-nums tracking-tight text-amber-300">
          {correctLabel(correct, total)}
        </p>
        <p className="mt-1 text-sm text-white/60">
          en {durationLabel(ms)}
          {place && <span className="font-bold text-white"> · {place}</span>}
        </p>
        {!listed && (
          <p className="mt-2 text-xs text-white/55">No sales en los rankings: el puesto solo lo ves tú.</p>
        )}
        {sections.length > 0 && (
          <ol className="mt-5 grid gap-2" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}>
            {sections.map((score) => (
              <li key={score.name} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2.5">
                <span className="block truncate text-[11px] text-white/55">{score.name}</span>
                <span
                  className={`block text-lg font-black tabular-nums ${
                    score.correct === score.total ? "text-emerald-300" : "text-white"
                  }`}
                >
                  {correctLabel(score.correct, score.total)}
                </span>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={share} className={primary}>
            <Share2 size={15} />
            {shared ?? "Compartir"}
          </button>
          <Link href="/honor" className={secondary}>
            <Trophy size={15} />
            Cuadro de honor
          </Link>
        </div>
        <p className="mt-5 text-xs text-white/55">
          Siguiente en <Countdown to={nextAt} />
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <h2 className="mb-2 text-sm font-black text-white">
          Top 10 de hoy{" "}
          <span className="font-normal text-white/45">
            · {players} {players === 1 ? "lo ha hecho" : "lo han hecho"}
          </span>
        </h2>
        {top.length ? (
          <ol className="space-y-0.5">
            {top.map((row) => (
              <li
                key={`${row.rank}-${row.name}`}
                className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${row.isMe ? "bg-amber-400/15" : ""}`}
              >
                <span className="w-5 text-xs font-black tabular-nums text-white/50">{row.rank}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{row.isMe ? "Tú" : row.name}</span>
                <span className="text-sm font-bold tabular-nums text-white/85">{correctLabel(row.correct, row.total)}</span>
                <span className="w-12 text-right text-xs tabular-nums text-white/45">{durationLabel(row.ms)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-2 text-xs text-white/45">Todavía no sale nadie.</p>
        )}
        <p className="mt-2 text-[11px] text-white/35">Más aciertos primero; a igualdad, quien tardó menos.</p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/70">
        <button
          type="button"
          onClick={() => setShowReview(!showReview)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-black text-white"
        >
          Ver tus respuestas
          <ChevronDown size={16} className={`text-white/50 transition ${showReview ? "rotate-180" : ""}`} />
        </button>
        {showReview && (
          <ol className="space-y-2 border-t border-white/5 p-3">
            {review.map((item, index) => (
              <li key={index} className="space-y-2">
                {item.section && item.section !== review[index - 1]?.section && (
                  <p className={`px-1 text-xs font-black text-amber-200 ${index > 0 ? "pt-2" : ""}`}>{item.section}</p>
                )}
                <div className="flex gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                <span
                  className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full ${
                    item.correct ? "bg-emerald-400/20 text-emerald-300" : "bg-rose-400/20 text-rose-300"
                  }`}
                >
                  {item.correct ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white">{item.title}</span>
                  <span className="block text-[11px] text-white/45">{item.summary}</span>
                  <span className="mt-1 block text-xs text-white/70">
                    {item.correct ? (
                      item.solution
                    ) : (
                      <>
                        Tú: <span className="text-rose-200">{bemol(item.given)}</span> · Era:{" "}
                        <span className="font-bold text-emerald-200">{bemol(item.solution)}</span>
                      </>
                    )}
                  </span>
                </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
