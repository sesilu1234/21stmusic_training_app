"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ThemeLogoPill from "@/app/components/ThemeLogoPill";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import RoundFooter from "@/app/components/RoundFooter";
import StaffNote from "@/app/components/StaffNote";
import StaffCard from "@/app/components/StaffCard";
import {
  answersFor,
  buildNoteReadingQuiz,
  NOTE_LETTERS,
  noteLabel,
  type NoteReadingLevel,
  type NoteReadingQuestion,
} from "@/lib/noteReading";
import { ROUND_LENGTH } from "@/lib/roundLength";
import { bemol } from "@/lib/bemol";

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
    return <div className="min-h-dvh bg-slate-950" />;
  }

  const solution = noteLabel(question);
  const isCorrect = answered === solution;
  const options = answersFor(level);
  // Naturales: una fila. Con alteraciones: #, naturales y b, por columnas.
  const rows: (string | null)[][] = level.accidentals
    ? ["#", "", "b"].map((sign) =>
        NOTE_LETTERS.map((letter) => (options.includes(letter + sign) ? letter + sign : null)),
      )
    : [options];

  return (
    <div className="relative min-h-dvh overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col px-4 pb-5 pt-4 md:px-8 md:pb-7 md:pt-5">
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
          <div className="flex w-[42px] md:w-[92px] flex-shrink-0 justify-end">
            <ThemeLogoPill />
          </div>
        </div>

        <main className="mt-auto mx-auto flex w-full max-w-[980px] flex-col pb-2 pt-3 md:pb-5 md:pt-8">
          <div className="mb-4 flex justify-center md:mb-7">
            <StaffCard>
              <StaffNote
                semitone={question.semitone}
                clef={question.clef}
                preferFlat={question.preferFlat}
                rareSpelling={question.rareSpelling}
                state={answered === null ? "idle" : isCorrect ? "correct" : "wrong"}
              />
            </StaffCard>
          </div>

          <div className="mx-auto w-full max-w-[720px] rounded-[2rem] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-md md:p-6">
            {level.accidentals ? (
              /*
                Con alteraciones, una columna por letra partida en tres:
                sostenido arriba, natural en medio (más grande) y bemol abajo.
                Se lee como siete teclas en vez de veintiún botones. Las que no
                salen nunca (Mi#, Si#, Fab, Dob) dejan su hueco vacío.
              */
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 md:gap-2.5">
                {NOTE_LETTERS.map((letter, columnIndex) => (
                  <div
                    key={letter}
                    className="flex flex-col divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    {rows.map((row, rowIndex) => {
                      const option = row[columnIndex];
                      const natural = rowIndex === 1;
                      const size = natural
                        ? "py-3 text-sm md:py-3.5 md:text-base"
                        : "py-1.5 text-xs md:py-2";

                      if (option === null) {
                        return <span key={rowIndex} aria-hidden className={`${size} select-none`}>&nbsp;</span>;
                      }

                      const isSolution = answered !== null && option === solution;
                      const isMistake = answered === option && !isCorrect;

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={answered !== null || gameOver}
                          onClick={() => answer(option)}
                          className={`${size} font-black tracking-tight transition active:bg-amber-400/30 ${
                            isSolution
                              ? "bg-emerald-400/25 text-emerald-100"
                              : isMistake
                                ? "bg-rose-500/25 text-rose-100"
                                : answered !== null
                                  ? "text-white/25"
                                  : natural
                                    ? "text-white hover:bg-amber-400/20"
                                    : "text-white/60 hover:bg-amber-400/20 hover:text-white"
                          }`}
                        >
                          {bemol(option)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 md:gap-3">
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
                      {bemol(option)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 flex min-h-[2.5rem] items-center justify-center md:mt-6">
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
                {bemol(isCorrect ? `¡Bien! Era ${solution}` : `Era ${solution}, no ${answered}`)}
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
