"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Timer } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import Staff, { type NoteState } from "@/app/components/Staff";
import { staffPosition } from "@/lib/staff";
import {
  SPRINT_ANSWERS,
  SPRINT_LENGTH,
  SPRINT_RUNS,
  buildSprint,
  type NoteSprintLevel,
  type SprintRun,
} from "@/lib/noteSprint";

type Phase = "ready" | "running" | "done";

/** Cuánto se queda a la vista la ristra recién acabada, con sus colores. */
const RUN_PAUSE_MS = 220;

const seconds = (ms: number) => (ms / 1000).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** El récord es de cada uno y de este navegador: una comodidad, no un dato que haya que guardar. */
const recordKey = (slug: string) => `lectura-contrarreloj:${slug}`;
const readRecord = (slug: string) => {
  try {
    const value = Number(window.localStorage.getItem(recordKey(slug)));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
};
const writeRecord = (slug: string, ms: number) => {
  try {
    window.localStorage.setItem(recordKey(slug), String(Math.round(ms)));
  } catch {
    // Sin almacenamiento (modo privado): sin récord, y ya está.
  }
};

export default function NoteSprintGame({ level }: { level: NoteSprintLevel }) {
  const limitMs = level.seconds * 1000;
  const [phase, setPhase] = useState<Phase>("ready");
  const [runs, setRuns] = useState<SprintRun[]>([]);
  const [results, setResults] = useState<boolean[][]>([]);
  const [runIndex, setRunIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  /** El tiempo final, si acabó las diez ristras antes del límite. */
  const [finishMs, setFinishMs] = useState<number | null>(null);
  const [record, setRecord] = useState<number | null>(null);
  const [newRecord, setNewRecord] = useState(false);

  const startedAt = useRef(0);
  const pausing = useRef(false);
  /** Lo mismo que `results`, para leerlo desde el reloj sin rehacerlo en cada nota. */
  const resultsRef = useRef<boolean[][]>([]);
  /** Que no se cierre dos veces si el reloj llega a cero justo con la última nota. */
  const finished = useRef(false);

  const start = () => {
    setRuns(buildSprint(level));
    resultsRef.current = Array.from({ length: SPRINT_RUNS }, () => []);
    setResults(resultsRef.current);
    setRunIndex(0);
    setElapsed(0);
    setFinishMs(null);
    setNewRecord(false);
    setRecord(readRecord(level.slug));
    pausing.current = false;
    finished.current = false;
    startedAt.current = performance.now();
    setPhase("running");
  };

  const finish = useCallback(
    (finalResults: boolean[][], doneMs: number | null) => {
      if (finished.current) return;
      finished.current = true;
      setPhase("done");
      setFinishMs(doneMs);
      const perfect = doneMs !== null && finalResults.every((run) => run.length === SPRINT_LENGTH && run.every(Boolean));
      if (perfect) {
        const previous = readRecord(level.slug);
        if (previous === null || doneMs < previous) {
          writeRecord(level.slug, doneMs);
          setNewRecord(previous !== null);
          setRecord(doneMs);
        }
      }
    },
    [level.slug],
  );

  // El reloj. Si llega al límite, se acaba: cuenta lo leído hasta ahí.
  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      const now = performance.now() - startedAt.current;
      setElapsed(now);
      if (now >= limitMs) {
        window.clearInterval(timer);
        setElapsed(limitMs);
        finish(resultsRef.current, null);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase, limitMs, finish]);

  /** `at`: la hora del clic, en el mismo reloj que performance.now(). */
  const answer = (label: string, at: number) => {
    if (phase !== "running" || pausing.current) return;
    const run = runs[runIndex];
    const position = results[runIndex].length;
    if (!run || position >= SPRINT_LENGTH) return;

    const next = results.map((item, index) => (index === runIndex ? [...item, label === run.labels[position]] : item));
    resultsRef.current = next;
    setResults(next);

    if (position + 1 < SPRINT_LENGTH) return;

    // Ristra acabada: la última, se para el reloj; si no, a la siguiente.
    if (runIndex + 1 >= SPRINT_RUNS) {
      // Por si el último clic cae entre dos vueltas del reloj, ya pasado el límite.
      const ms = at - startedAt.current;
      finish(next, ms <= limitMs ? ms : null);
      return;
    }
    pausing.current = true;
    window.setTimeout(() => {
      pausing.current = false;
      setRunIndex(runIndex + 1);
    }, RUN_PAUSE_MS);
  };

  const correct = results.flat().filter(Boolean).length;
  const total = SPRINT_RUNS * SPRINT_LENGTH;
  const run = runs[runIndex];
  const done = results[runIndex] ?? [];
  const left = Math.max(0, limitMs - elapsed);
  const urgent = left < 10000;

  const columns =
    run?.notes.map((semitone, index) => {
      const { degree } = staffPosition(semitone, false);
      const state: NoteState =
        index < done.length
          ? done[index]
            ? "correct"
            : "wrong"
          : index === done.length && phase === "running"
            ? "hint"
            : "idle";
      return [{ degree, state }];
    }) ?? [];

  const detail =
    finishMs !== null
      ? `${seconds(finishMs)} s${newRecord ? " · ¡récord nuevo!" : record !== null ? ` · récord ${seconds(record)} s` : ""}`
      : "Se acabó el tiempo";

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {phase === "done" && <GameOverModal correct={correct} total={total} detail={detail} onRestart={start} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-4 md:px-8 md:pb-7 md:pt-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href="/play/lectura-notas"
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/50 px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60 backdrop-blur-sm transition hover:border-amber-300/50 hover:text-white md:px-4"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Niveles</span>
          </Link>

          <div className="min-w-0 text-center">
            <h1
              className="text-balance text-xl font-black italic uppercase leading-tight tracking-tighter text-white sm:text-2xl md:text-3xl"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              Lee <span className="text-amber-300">rápido</span>
            </h1>
            <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.28em] text-white/35">
              {level.title}
            </p>
          </div>

          <div className="flex w-[42px] flex-shrink-0 justify-end md:w-[92px]">
            <ThemeToggle onPhoto />
          </div>
        </div>

        <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col justify-center pb-8 pt-6 md:pb-10 md:pt-8">
          {phase === "ready" ? (
            <section className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/70 p-7 text-center backdrop-blur-md">
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/25 bg-amber-400/10">
                <Timer size={24} strokeWidth={1.75} className="text-amber-300" />
              </span>
              <p className="text-lg font-black text-white">
                {SPRINT_RUNS} ristras de {SPRINT_LENGTH} notas en {level.seconds} s
              </p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Di las notas de izquierda a derecha. Si fallas una, sigues: cuenta como fallo. Las diez sin fallos y a
                tiempo, medalla.
              </p>
              <RecordLine slug={level.slug} />
              <button
                type="button"
                onClick={start}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-amber-300"
              >
                <Play size={15} />
                Empezar
              </button>
            </section>
          ) : (
            <>
              {phase === "done" ? (
                // Terminada: en vez del reloj, flechas para repasar ristra a
                // ristra lo que salió bien y lo que no.
                <div className="mx-auto mb-5 flex w-full max-w-[640px] items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setRunIndex(runIndex - 1)}
                    disabled={runIndex === 0}
                    aria-label="Ristra anterior"
                    className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white transition hover:bg-white/10 disabled:opacity-25"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="min-w-[8rem] text-center text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
                    Ristra {runIndex + 1}/{SPRINT_RUNS}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRunIndex(runIndex + 1)}
                    disabled={runIndex >= SPRINT_RUNS - 1}
                    aria-label="Ristra siguiente"
                    className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white transition hover:bg-white/10 disabled:opacity-25"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
              <div className="mx-auto mb-5 flex w-full max-w-[640px] items-center gap-3">
                <span className="text-sm font-black tabular-nums text-white">
                  {Math.min(runIndex + 1, SPRINT_RUNS)}/{SPRINT_RUNS}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className={`block h-full rounded-full ${urgent ? "bg-rose-400" : "bg-amber-300"}`}
                    style={{ width: `${(left / limitMs) * 100}%` }}
                  />
                </span>
                <span
                  className={`flex items-center gap-1 text-sm font-black tabular-nums ${urgent ? "text-rose-300" : "text-white/70"}`}
                >
                  <Timer size={14} />
                  {seconds(elapsed)} s
                </span>
              </div>
              )}

              <div className="mx-auto mb-7 w-full max-w-[640px] rounded-[2.5rem] border-4 border-white bg-white px-6 py-2 shadow-2xl">
                {run && (
                  <Staff
                    clef={run.clef}
                    columns={columns}
                    label="Ristra de notas"
                    pointer={phase === "running" ? done.length : undefined}
                  />
                )}
              </div>

              {/* Al repasar, qué nota era cada una: en verde las acertadas, en
                  rojo las falladas y en gris las que no dio tiempo a leer. */}
              {phase === "done" && run && (
                <div className="mx-auto -mt-3 mb-6 flex w-full max-w-[640px] justify-center gap-2">
                  {run.labels.map((label, index) => (
                    <span
                      key={index}
                      className={`min-w-[3.25rem] rounded-xl border px-2 py-1.5 text-center text-sm font-black ${
                        index >= done.length
                          ? "border-white/10 bg-white/5 text-white/40"
                          : done[index]
                            ? "border-green-400/50 bg-green-500/20 text-green-200"
                            : "border-red-400/50 bg-red-500/20 text-red-200"
                      }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              <div className="mx-auto w-full max-w-[720px] rounded-[2rem] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-md md:p-6">
                <div className="grid grid-cols-7 gap-1.5 md:gap-3">
                  {SPRINT_ANSWERS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={phase !== "running"}
                      onClick={(event) => answer(option, event.timeStamp)}
                      className="rounded-xl border border-white/10 bg-white/5 py-4 text-sm font-black tracking-tight text-white transition hover:border-amber-300/50 hover:bg-amber-400/20 active:scale-95 md:py-5 md:text-base"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-5 text-center text-[11px] uppercase tracking-[0.2em] text-white/30">
                {correct} de {total} notas bien
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/** El récord en la portada del nivel. Se lee en el cliente: en el servidor no hay localStorage. */
const RecordLine = ({ slug }: { slug: string }) => {
  const [record, setRecord] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecord(readRecord(slug));
  }, [slug]);
  if (record === null) return null;
  return <p className="mt-3 text-xs font-bold text-amber-200">Tu récord: {seconds(record)} s</p>;
};
