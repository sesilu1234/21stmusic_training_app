"use client";

import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import Crown from "./Crown";
import RoundLengthPicker from "./RoundLengthPicker";

interface Props {
  correct: number;
  total: number;
  /** Por defecto recarga la página */
  onRestart?: () => void;
}

const SPARKLES = [
  { top: "4%", left: "12%", size: 10, delay: "0s" },
  { top: "16%", left: "84%", size: 14, delay: "0.4s" },
  { top: "52%", left: "4%", size: 8, delay: "0.8s" },
  { top: "62%", left: "92%", size: 11, delay: "1.2s" },
  { top: "0%", left: "58%", size: 9, delay: "1.6s" },
];

export default function GameOverModal({ correct, total, onRestart }: Props) {
  const safeTotal = Math.max(1, total);
  const perfect = correct === total && total > 0;
  const pct = Math.round((correct / safeTotal) * 100);
  const restart = onRestart || (() => window.location.reload());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xl">
      {perfect && (
        <div className="glow-pulse pointer-events-none absolute h-[26rem] w-[26rem] rounded-full bg-amber-400/25 blur-3xl" />
      )}

      <div className="rise-in relative w-full max-w-sm rounded-[2.5rem] border border-white/15 bg-slate-950/80 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:p-10">
        {perfect ? (
          <>
            <div className="relative mx-auto mb-6 h-32 w-40">
              {SPARKLES.map((sparkleStyle, index) => (
                <span
                  key={index}
                  className="sparkle absolute text-amber-200"
                  style={{
                    top: sparkleStyle.top,
                    left: sparkleStyle.left,
                    fontSize: sparkleStyle.size,
                    animationDelay: sparkleStyle.delay,
                  }}
                >
                  ✦
                </span>
              ))}
              <div className="crown-pop h-full w-full">
                <Crown className="crown-float h-full w-full drop-shadow-[0_10px_25px_rgba(251,191,36,0.45)]" />
              </div>
            </div>

            <h2
              className="text-4xl font-black uppercase italic tracking-tighter text-amber-400"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              ¡Pleno!
            </h2>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-100/80">
              {correct} de {total} · todas correctas
            </p>

          </>
        ) : (
          <>
            <h2
              className="text-3xl font-black uppercase italic tracking-tighter text-white"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              ¡Hecho!
            </h2>

            <div
              className="my-6 text-5xl font-black italic text-amber-400"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              {correct}
              <span className="mx-2 text-2xl text-white/20">/</span>
              {total}
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-rose-400"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
              {pct >= 80
                ? "Casi perfecto, te falta muy poco"
                : pct >= 50
                  ? "Bien, sigue así"
                  : "A seguir practicando"}
            </p>
          </>
        )}

        <div className="mt-7 space-y-3">
          <RoundLengthPicker />

          <button
            onClick={restart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-4 text-xs font-black uppercase tracking-widest text-black transition hover:bg-amber-400"
          >
            <RotateCcw size={14} />
            Reiniciar
          </button>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:text-white"
          >
            <Home size={13} />
            Menú
          </Link>
        </div>
      </div>
    </div>
  );
}
