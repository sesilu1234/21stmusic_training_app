"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCw, Volume2 } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import { PRESET_ICONS, PRESETS, useAudio } from "../../audio";
import {
  buildChordQuiz,
  chordNotes,
  findLevel,
  tonicChord,
  type ChordLevel,
  type ChordOption,
} from "@/lib/chordEar";
import { getStoredRoundLength } from "@/lib/roundLength";

/** Hueco entre la tónica de referencia y el acorde de la pregunta. */
const GAP_MS = 1150;

interface Question {
  option: ChordOption;
  keyRoot: number;
}

interface Round {
  questions: Question[];
  answers: (string | null)[];
}

const createRound = (level: ChordLevel): Round => {
  const total = getStoredRoundLength();
  return {
    questions: buildChordQuiz(level, total),
    answers: Array<string | null>(total).fill(null),
  };
};

export default function AcordesOidoPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findLevel(nivel);
  if (!level) notFound();

  return <ChordEarGame level={level} />;
}

function ChordEarGame({ level }: { level: ChordLevel }) {
  const { playSequence } = useAudio();

  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [gameOver, setGameOver] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);
  const [playFlash, setPlayFlash] = useState<0 | 1 | 2>(0);

  const advanceTimerRef = useRef<number | null>(null);
  const flashStepTimerRef = useRef<number | null>(null);
  const flashEndTimerRef = useRef<number | null>(null);
  const autoPlayRef = useRef(true);

  useEffect(() => {
    const begin = () => setRound(createRound(level));
    begin();
  }, [level]);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      if (flashStepTimerRef.current) window.clearTimeout(flashStepTimerRef.current);
      if (flashEndTimerRef.current) window.clearTimeout(flashEndTimerRef.current);
    },
    [],
  );

  const total = round?.questions.length ?? 0;
  const question = round?.questions[step];
  const correctCount =
    round?.answers.reduce<number>(
      (sum, answer, index) =>
        answer && answer === round.questions[index].option.id ? sum + 1 : sum,
      0,
    ) ?? 0;

  const play = useCallback(
    (target?: Question) => {
      if (!target) return;
      if (flashStepTimerRef.current) window.clearTimeout(flashStepTimerRef.current);
      if (flashEndTimerRef.current) window.clearTimeout(flashEndTimerRef.current);

      setPlayFlash(level.mode === "grado" ? 1 : 2);
      if (level.mode === "grado") {
        flashStepTimerRef.current = window.setTimeout(() => setPlayFlash(2), GAP_MS);
      }
      flashEndTimerRef.current = window.setTimeout(
        () => setPlayFlash(0),
        level.mode === "grado" ? GAP_MS + 950 : 950,
      );

      const chord = chordNotes(target.option, target.keyRoot);
      const chords =
        level.mode === "grado" ? [tonicChord(target.keyRoot), chord] : [chord];
      playSequence(chords, GAP_MS, presetIdx);
    },
    [level.mode, playSequence, presetIdx],
  );

  // Suena sola al llegar a cada pregunta nueva, pero no al volver de un
  // cambio de instrumento ni tras responder.
  useEffect(() => {
    if (!question || gameOver || !autoPlayRef.current) return;
    autoPlayRef.current = false;
    const timer = window.setTimeout(() => play(question), 150);
    return () => window.clearTimeout(timer);
  }, [question, gameOver, play]);

  const answer = (optionId: string) => {
    if (!round || !question || round.answers[step] !== null || gameOver) return;

    const answers = [...round.answers];
    answers[step] = optionId;
    setRound({ ...round, answers });
    setAnswerState(optionId === question.option.id ? "correct" : "wrong");

    advanceTimerRef.current = window.setTimeout(() => {
      if (step < total - 1) {
        autoPlayRef.current = true;
        setStep(step + 1);
        setAnswerState("idle");
      } else {
        setGameOver(true);
      }
    }, 1000);
  };

  if (!round || !question) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const answered = round.answers[step];
  const solution = question.option.id;
  const questionChordNotes = Math.max(3, question.option.shape.length);
  const answerGridClass =
    level.options.length === 2
      ? "grid-cols-2"
      : level.options.length === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : level.options.length >= 5
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
          : "grid-cols-2 sm:grid-cols-3";

  const optionClass = (optionId: string) => {
    if (!answered) {
      return "border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-white/10";
    }
    if (optionId === solution) return "border-emerald-400/60 bg-emerald-400/20 text-emerald-100";
    if (optionId === answered) return "border-rose-400/60 bg-rose-400/20 text-rose-100";
    return "border-white/5 bg-white/[0.02] text-white/25";
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && (
        <GameOverModal correct={correctCount} total={total} />
      )}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[960px] flex-col px-4 pb-5 pt-16 md:px-8 md:pb-7 md:pt-20">
        {/* Cabecera compacta: baja lo suficiente para quedar unida al bloque del juego. */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href="/play/oido/acordes"
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/50 px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60 backdrop-blur-sm transition hover:border-violet-300/50 hover:text-white md:px-4"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Niveles</span>
          </Link>

          <div className="min-w-0 text-center">
            <h1
              className="text-balance text-xl font-black italic uppercase leading-tight tracking-tighter text-white sm:text-2xl md:text-3xl"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              {level.mode === "grado" ? (
                <>
                  ¿Qué{" "}
                  <span className="text-violet-300">GRADO</span> es?
                </>
              ) : (
                <>
                  ¿Qué{" "}
                  <span className="text-violet-300">ACORDE</span> es?
                </>
              )}
            </h1>
            <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.28em] text-white/35">
              {level.badge} · {level.title}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-slate-950/50 p-1 backdrop-blur-sm">
            {PRESETS.map((preset, index) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPresetIdx(index)}
                title={preset.label}
                aria-label={preset.label}
                className={`grid h-7 w-7 place-items-center rounded-full text-xs transition md:h-8 md:w-8 md:text-sm ${
                  presetIdx === index ? "bg-violet-400/25" : "opacity-40 hover:opacity-80"
                }`}
              >
                {PRESET_ICONS[index]}
              </button>
            ))}
          </div>
        </div>

        <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-start pb-10 pt-8 md:pb-12 md:pt-10">
          {level.mode === "grado" && (
            <p className="mb-3 text-center text-xs text-white/35">
              Primero suena la tónica y después el acorde.
            </p>
          )}

          <div className="mb-7 flex flex-col items-center gap-4">
            <div className="relative flex w-full max-w-[620px] flex-col items-center">
              <div className="relative flex h-[190px] w-full items-center justify-center overflow-hidden rounded-[2.25rem] border-4 border-white bg-white shadow-2xl md:h-[230px] md:rounded-[3rem]">
                <div className="absolute right-7 top-5 text-2xl font-black italic text-black/10">
                  #{step + 1}
                </div>

                <div className="flex items-center gap-5 md:gap-9">
                  {level.mode === "grado" && (
                    <>
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-black/30">
                          Tónica
                        </span>
                        <div
                          className={`relative grid h-20 w-20 place-items-center rounded-3xl border-2 text-3xl shadow-xl transition md:h-24 md:w-24 md:text-4xl ${
                            playFlash === 1
                              ? "scale-110 border-amber-300 bg-amber-300 text-black shadow-[5px_5px_0px_#000]"
                              : "border-black/10 bg-white text-black/25 shadow-[5px_5px_0px_rgba(0,0,0,0.10)]"
                          }`}
                        >
                          <span className="-mt-1">♩</span>
                          <span className="absolute bottom-5 left-1/2 h-2 w-12 -translate-x-1/2 rounded-full bg-current opacity-20" />
                        </div>
                      </div>

                      <div className="text-4xl font-black italic text-black/15">→</div>
                    </>
                  )}

                  <div className="flex flex-col items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-black/30">
                      Acorde
                    </span>
                    <div className="flex items-center gap-3 md:gap-4">
                      {Array.from({ length: questionChordNotes }).map((_, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center gap-2"
                        >
                          {level.mode === "calidad" && (
                            <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/35 md:text-[9px]">
                              Nota {index + 1}
                            </span>
                          )}
                          <div
                            className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 text-2xl font-black italic shadow-lg transition md:h-[72px] md:w-[72px] md:text-3xl ${
                              playFlash === 2
                                ? "scale-110 border-black bg-sky-400 text-black shadow-[4px_4px_0px_#000]"
                                : "border-black bg-white text-black/20 shadow-[4px_4px_0px_rgba(0,0,0,0.12)]"
                            }`}
                          >
                            ♩
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => play(question)}
                className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-violet-100 transition hover:border-violet-300/60 hover:bg-violet-400/20"
              >
                <Volume2 size={14} strokeWidth={1.8} />
                Escuchar
              </button>

              <button
                type="button"
                onClick={() => play(question)}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/35 transition hover:text-white/70"
              >
                <RotateCw size={12} />
                Repetir
              </button>
            </div>
          </div>

          <div className={`mx-auto grid w-full max-w-[620px] gap-3 ${answerGridClass}`}>
            {level.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => answer(option.id)}
                disabled={Boolean(answered)}
                className={`min-h-[72px] rounded-2xl border px-4 py-4 text-xl font-black uppercase tracking-tight backdrop-blur-sm transition duration-150 disabled:cursor-default ${optionClass(option.id)}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p
            className={`mt-5 text-center text-xs font-black uppercase tracking-[0.2em] transition-opacity ${
              answerState === "correct"
                ? "text-emerald-300 opacity-100"
                : answerState === "wrong"
                  ? "text-rose-300 opacity-100"
                  : "opacity-0"
            }`}
          >
            {answerState === "correct" ? "¡Bien!" : `Era ${question.option.label}`}
          </p>
        </main>

        <footer className="pb-4">
          <div className="mb-3 flex flex-wrap justify-center gap-1.5">
            {round.questions.map((item, index) => {
              const given = round.answers[index];
              return (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === step ? "w-5 bg-violet-300" : "w-1.5"
                  } ${
                    given === null
                      ? index === step
                        ? ""
                        : "bg-white/15"
                      : given === item.option.id
                        ? "bg-emerald-400"
                        : "bg-rose-400"
                  }`}
                />
              );
            })}
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">
            {step + 1} / {total} · {correctCount} {correctCount === 1 ? "acierto" : "aciertos"}
          </p>
        </footer>
      </div>
    </div>
  );
}
