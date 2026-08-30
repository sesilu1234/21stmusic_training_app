"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import RoundFooter from "@/app/components/RoundFooter";
import StaffNote from "@/app/components/StaffNote";
import {
  answersFor,
  buildNoteReadingQuiz,
  noteLabel,
  type NoteReadingLevel,
  type NoteReadingQuestion,
} from "@/lib/noteReading";
import { ROUND_LENGTH } from "@/lib/roundLength";

interface Round {
  questions: NoteReadingQuestion[];
  answers: (string | null)[];
}

const createRound = (level: NoteReadingLevel): Round => {
  const total = ROUND_LENGTH;
  return {
    questions: buildNoteReadingQuiz(level, total),
    answers: Array<string | null>(total).fill(null),
  };
};

export default function NoteReadingGame({ level }: { level: NoteReadingLevel }) {
  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  /** true mientras estás mirando una pregunta vieja en vez de jugando. */
  const [reviewing, setReviewing] = useState(false);

  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // La ronda se sortea con Math.random(): armarla durante el render del
    // servidor daría una distinta al hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(createRound(level));
    setStep(0);
    setGameOver(false);
    setReviewing(false);
  }, [level]);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    },
    [],
  );

  const total = round?.questions.length ?? 0;
  const question = round?.questions[step];
  const answered = round?.answers[step] ?? null;
  const correctCount =
    round?.answers.reduce<number>(
      (sum, answer, index) =>
        answer !== null && answer === noteLabel(round.questions[index]) ? sum + 1 : sum,
      0,
    ) ?? 0;

  const answer = (label: string) => {
    if (!round || !question || answered !== null || gameOver) return;

    const answers = [...round.answers];
    answers[step] = label;
    setRound({ ...round, answers });

    const isCorrect = label === noteLabel(question);
    advanceTimerRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          setStep(step + 1);
        } else {
          setGameOver(true);
        }
      },
      isCorrect ? 550 : 1500,
    );
  };

  /** En qué pregunta va la partida. -1 = ya están todas contestadas. */
  const liveStep = round?.answers.findIndex((answer) => answer === null) ?? 0;

  /**
   * Ir a una pregunta ya contestada para volver a verla y ver qué pusiste y
   * qué era. No se puede saltar hacia delante: como mucho, a la que está en
   * juego.
   */
  const goTo = (index: number) => {
    const last = liveStep === -1 ? total - 1 : liveStep;
    if (index < 0 || index > last || index === step) return;

    // Puede haber un avance en marcha (se acaba de contestar): se cancela,
    // que si no daría un salto en mitad de la revisión.
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    setReviewing(index !== last);
    setStep(index);

    // Si ya no queda ninguna sin contestar, volver a la última es terminar:
    // el avance que iba a cerrar la partida lo hemos cancelado nosotros.
    if (liveStep === -1 && index === total - 1) setGameOver(true);
  };

  if (!round || !question) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const solution = noteLabel(question);
  const isCorrect = answered === solution;
  const options = answersFor(level);

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-16 md:px-8 md:pb-7 md:pt-20">
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
              ¿Qué <span className="text-amber-300">nota</span> es?
            </h1>
            <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.28em] text-white/35">
              {level.badge} · {level.title}
            </p>
          </div>

          {/* Hueco simétrico al botón de volver, para que el título quede centrado. */}
          <span aria-hidden className="w-[42px] md:w-[92px]" />
        </div>

        <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col justify-center pb-8 pt-6 md:pb-10 md:pt-8">
          <div className="mb-7 flex justify-center">
            <div className="w-full max-w-[330px] rounded-3xl border-4 border-white/15 bg-slate-950/70 px-4 py-3 shadow-2xl backdrop-blur-sm">
              <StaffNote
                semitone={question.semitone}
                clef={question.clef}
                preferFlat={question.preferFlat}
                state={answered === null ? "idle" : isCorrect ? "correct" : "wrong"}
              />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[720px] rounded-[2rem] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-md md:p-6">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:gap-3">
              {options.map((option) => {
                const isSolution = answered !== null && option === solution;
                const isMistake = answered === option && !isCorrect;

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={answered !== null || gameOver}
                    onClick={() => answer(option)}
                    className={`rounded-xl border py-3 text-sm font-black tracking-tight transition active:scale-95 md:py-4 md:text-base ${
                      isSolution
                        ? "border-emerald-400 bg-emerald-400/25 text-emerald-100"
                        : isMistake
                          ? "border-rose-400 bg-rose-500/25 text-rose-100"
                          : answered !== null
                            ? "border-white/5 bg-white/5 text-white/25"
                            : "border-white/10 bg-white/5 text-white hover:border-amber-300/50 hover:bg-amber-400/20"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex min-h-[2.5rem] items-center justify-center">
            {answered === null ? (
              <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/25">
                Di qué nota está escrita
              </p>
            ) : (
              <p
                className={`text-center text-xs font-black uppercase tracking-[0.2em] ${
                  isCorrect ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {isCorrect ? `¡Bien! Era ${solution}` : `Era ${solution}, no ${answered}`}
              </p>
            )}
          </div>
        </main>

        <RoundFooter
          step={step}
          total={total}
          liveStep={liveStep}
          results={round.questions.map((item, index) => {
            const given = round.answers[index];
            return given === null ? null : given === noteLabel(item);
          })}
          correctCount={correctCount}
          reviewing={reviewing}
          onGoTo={goTo}
          accent="amber"
        />
      </div>
    </div>
  );
}
