"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCw, Volume2 } from "lucide-react";
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
import { useStoredThemeMode } from "@/lib/themeMode";

const GAME_NAME = "Acordes al oído";
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
  const [isDarkMode] = useStoredThemeMode();
  const { playSequence } = useAudio();

  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [gameOver, setGameOver] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);

  const advanceTimerRef = useRef<number | null>(null);
  const autoPlayRef = useRef(true);

  useEffect(() => {
    const begin = () => setRound(createRound(level));
    begin();
  }, [level]);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
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
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/background.jpeg')" }}
      >
        <div
          className={`absolute inset-0 backdrop-blur-[3px] ${
            isDarkMode
              ? "bg-gradient-to-b from-slate-950/92 via-slate-950/82 to-slate-950/95"
              : "bg-gradient-to-b from-slate-900/65 via-slate-900/45 to-slate-900/70"
          }`}
        />
      </div>

      {gameOver && (
        <GameOverModal game={GAME_NAME} correct={correctCount} total={total} />
      )}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-5 md:px-6 md:py-7">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/play/oido/acordes"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 backdrop-blur-sm transition hover:border-violet-300/40 hover:text-white"
          >
            <ArrowLeft size={14} />
            Niveles
          </Link>

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/50 p-1 backdrop-blur-sm">
            {PRESETS.map((preset, index) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPresetIdx(index)}
                title={preset.label}
                aria-label={preset.label}
                className={`grid h-8 w-8 place-items-center rounded-full text-sm transition ${
                  presetIdx === index ? "bg-violet-400/25" : "opacity-40 hover:opacity-80"
                }`}
              >
                {PRESET_ICONS[index]}
              </button>
            ))}
          </div>
        </div>

        <main className="flex flex-1 flex-col justify-center py-8">
          <div className="mb-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-300">
              {level.badge} · {level.title}
            </p>
            <p className="mt-2 text-xs text-white/40">
              {level.mode === "grado"
                ? "Primero la tónica, después el acorde. ¿Qué grado es?"
                : "¿Qué tipo de acorde es?"}
            </p>
          </div>

          <div className="mb-7 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => play(question)}
              className="group grid h-28 w-28 place-items-center rounded-full border border-violet-300/30 bg-violet-400/10 text-violet-200 transition hover:scale-105 hover:border-violet-300/60 hover:bg-violet-400/20 md:h-32 md:w-32"
            >
              <span className="flex flex-col items-center gap-1.5">
                <Volume2 size={34} strokeWidth={1.5} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                  Escuchar
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => play(question)}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/35 transition hover:text-white/70"
            >
              <RotateCw size={12} />
              Repetir
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {level.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => answer(option.id)}
                disabled={Boolean(answered)}
                className={`rounded-2xl border py-4 text-base font-black uppercase tracking-tight backdrop-blur-sm transition duration-150 disabled:cursor-default ${optionClass(option.id)}`}
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
