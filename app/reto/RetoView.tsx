"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Play, RotateCcw, Share2 } from "lucide-react";
import { unlockAudio } from "@/app/components/notePlayer";
import { ECO_VISUAL_ROUNDS } from "@/lib/eco";
import { RETOS, retoNumber, retoShareText, scoreLabel, type RetoKind } from "@/lib/reto";
// Solo el tipo: el resultado se arma en el servidor.
import type { EcoResult } from "@/lib/ecoResult";
import EcoGame from "./EcoGame";
import PulsoGame from "./PulsoGame";
import { finishReto, progressReto, startReto } from "./actions";

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
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-amber-300 disabled:opacity-60";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-slate-950/60 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/80 transition hover:border-white/30 hover:text-white";

const ResultView = ({ result, onPractice }: { result: EcoResult; onPractice: () => void }) => {
  const [shared, setShared] = useState<string | null>(null);
  const reto = RETOS[result.kind];
  const text = retoShareText(result.kind, result.day, result.score);

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

  const place = result.rank > 0 ? `${result.listed ? "" : "irías "}${result.rank}º de hoy` : null;

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 text-center shadow-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
          {reto.name} #{result.number}
        </p>
        <p className="mt-3 text-3xl font-black tracking-tight text-white">
          {scoreLabel(result.kind, result.score)}
          {place && <span className="text-amber-300"> · {place}</span>}
        </p>
        {result.unfinished && (
          <p className="mt-2 text-xs text-white/55">La partida se cortó: cuenta lo que llevabas hecho.</p>
        )}
        {!result.listed && (
          <p className="mt-2 text-xs text-white/55">No sales en los rankings: el puesto solo lo ves tú.</p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={share} className={primary}>
            <Share2 size={15} />
            {shared ?? "Compartir"}
          </button>
          <button type="button" onClick={onPractice} className={secondary}>
            <Dumbbell size={15} />
            Practicar
          </button>
        </div>
        <p className="mt-5 text-xs text-white/55">
          Siguiente en <Countdown to={result.nextAt} />
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <h2 className="mb-2 text-sm font-black text-white">
          Top 10 de hoy{" "}
          <span className="font-normal text-white/45">
            · {result.players} {result.players === 1 ? "ha jugado" : "han jugado"}
          </span>
        </h2>
        {result.top.length ? (
          <ol className="space-y-0.5">
            {result.top.map((row) => (
              <li
                key={`${row.rank}-${row.name}`}
                className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${row.isMe ? "bg-amber-400/15" : ""}`}
              >
                <span className="w-5 text-xs font-black tabular-nums text-white/50">{row.rank}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{row.isMe ? "Tú" : row.name}</span>
                <span className="text-sm tabular-nums text-white/80">{scoreLabel(result.kind, row.score)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-2 text-xs text-white/45">Todavía no ha jugado nadie.</p>
        )}
      </section>
    </div>
  );
};

/** Cómo se juega, en la presentación de cada reto. */
const RULES: Record<RetoKind, string> = {
  eco: `Ronda 1, una nota; ronda 2, dos; y cada vez un poco más deprisa. Hasta la ronda ${ECO_VISUAL_ROUNDS} se ve qué suena; después, solo se oye. Sin prisa: entre nota y nota tienes todo el tiempo que quieras.`,
  pulso:
    "Cuenta el metrónomo, suena un ritmo, vuelve a contar y lo repites tocando el botón (o la barra espaciadora). Lo que cuenta es el ritmo, no la hora exacta: da igual si llevas cascos con retraso.",
};

type Mode = "intro" | "reto" | "practica" | "saving" | "practica-fin" | "result";

/**
 * Un reto entero: la presentación, la partida que cuenta, la práctica y el
 * resultado. La partida de verdad gasta el intento del día al pulsar
 * "Empezar"; la práctica no se guarda ni sale en ningún ranking.
 */
export default function RetoView({
  kind,
  today,
  initialResult,
}: {
  kind: RetoKind;
  today: string;
  initialResult: EcoResult | null;
}) {
  const reto = RETOS[kind];
  const [mode, setMode] = useState<Mode>(initialResult ? "result" : "intro");
  const [result, setResult] = useState<EcoResult | null>(initialResult);
  const [day, setDay] = useState(today);
  const [seed, setSeed] = useState("");
  /** Para que cada partida (otra práctica, otra vuelta) monte el juego de cero. */
  const [run, setRun] = useState(0);
  const [practiceScore, setPracticeScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const lastPayload = useRef<unknown>(null);

  const begin = () => {
    // Lo primero, dentro del toque: si no, iOS no deja sonar nada.
    unlockAudio();
    setError(null);
    startTransition(async () => {
      const response = await startReto(kind);
      if (!response.ok) {
        if (response.result) {
          setResult(response.result);
          setMode("result");
        } else setError(response.error ?? "No se ha podido empezar.");
        return;
      }
      setDay(response.day);
      setSeed(response.day);
      setRun((value) => value + 1);
      setMode("reto");
    });
  };

  const practice = () => {
    unlockAudio();
    setError(null);
    setSeed(`practica-${Math.random().toString(36).slice(2)}`);
    setRun((value) => value + 1);
    setMode("practica");
  };

  const save = useCallback(
    (payload: unknown) => {
      lastPayload.current = payload;
      setMode("saving");
      setError(null);
      startTransition(async () => {
        const response = await finishReto(kind, day, payload);
        if (response.ok) {
          setResult(response.result);
          setMode("result");
        } else setError(response.error);
      });
    },
    [kind, day],
  );

  const onCheckpoint = useCallback(
    (payload: unknown) => {
      // Solo la partida de verdad, y sin esperar: es una red por si se corta.
      if (mode === "reto") void progressReto(kind, day, payload);
    },
    [mode, kind, day],
  );

  const onEnd = useCallback(
    (payload: unknown, score: number) => {
      if (mode === "practica") {
        setPracticeScore(score);
        setMode("practica-fin");
      } else save(payload);
    },
    [mode, save],
  );

  const playing = mode === "reto" || mode === "practica";

  return (
    <div className="mx-auto w-full max-w-md">
      <Link
        href="/reto"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-white/55 transition hover:text-white"
      >
        <ArrowLeft size={14} />
        Retos de hoy
      </Link>

      <header className="mb-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
          {mode === "practica" || mode === "practica-fin" ? "Práctica · no cuenta" : "Reto diario"}
        </p>
        <h1 className="mt-1 text-3xl font-black italic tracking-tight text-white">
          {reto.name} <span className="text-amber-300">#{retoNumber(kind, today)}</span>
        </h1>
      </header>

      {playing &&
        (kind === "eco" ? (
          <EcoGame key={run} seedKey={seed} onCheckpoint={onCheckpoint} onEnd={onEnd} />
        ) : (
          <PulsoGame key={run} seedKey={seed} onCheckpoint={onCheckpoint} onEnd={onEnd} />
        ))}

      {mode === "intro" && (
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 text-center shadow-2xl">
          <p className="text-4xl leading-none">{reto.symbol}</p>
          <p className="mt-3 text-base font-black text-white">{reto.tagline}</p>
          <p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-white/60">{RULES[kind]}</p>
          <p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-white/45">
            Un intento al día: al pulsar Empezar ya cuenta. Si quieres probar antes, practica.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" onClick={begin} disabled={pending} className={primary}>
              <Play size={15} />
              {pending ? "Preparando…" : "Empezar"}
            </button>
            <button type="button" onClick={practice} className={secondary}>
              <Dumbbell size={15} />
              Practicar
            </button>
          </div>
        </section>
      )}

      {mode === "saving" && (
        <p className="mt-6 text-center text-sm font-bold text-white/70">{pending ? "Contando…" : ""}</p>
      )}

      {mode === "practica-fin" && (
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 text-center shadow-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">Práctica</p>
          <p className="mt-2 text-3xl font-black text-white">{scoreLabel(kind, practiceScore)}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={practice} className={secondary}>
              <RotateCcw size={15} />
              Otra vez
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode(result ? "result" : "intro");
              }}
              className={primary}
            >
              {result ? "Ver mi resultado" : "Al reto de hoy"}
            </button>
          </div>
        </section>
      )}

      {mode === "result" && result && <ResultView result={result} onPractice={practice} />}

      {error && (
        <p className="mt-4 text-center text-sm text-rose-300">
          {error}
          {mode === "saving" && !pending && (
            <>
              {" "}
              <button type="button" onClick={() => save(lastPayload.current)} className="font-bold underline">
                Reintentar
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
