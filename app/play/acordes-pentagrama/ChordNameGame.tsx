"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import Staff, { type NoteState } from "@/app/components/Staff";
import { alterAccidental, spelledName, type SpelledNote } from "@/lib/staff";
import {
  buildChordStaffQuiz,
  chordName,
  type ChordStaffLevel,
  type ChordStaffQuestion,
} from "@/lib/staffChords";
import { ROUND_LENGTH } from "@/lib/roundLength";

/** Lo que se ha contestado: la fundamental y la especie, cada una por su lado. */
interface Answer {
  root: string;
  shapeId: string;
}

interface Round {
  questions: ChordStaffQuestion[];
  answers: (Answer | null)[];
}

const NATURAL_ROOT_NAMES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
const ALTERED_ROOT_NAMES = ["Do#", "Reb", "Mib", "Fa#", "Sol#", "Lab", "Sib"];

const rootOptions = (level: ChordStaffLevel) =>
  level.alteredRoots
    ? [...NATURAL_ROOT_NAMES, ...ALTERED_ROOT_NAMES]
    : NATURAL_ROOT_NAMES;

const createRound = (level: ChordStaffLevel): Round => {
  const total = ROUND_LENGTH;
  return {
    questions: buildChordStaffQuiz(level, total),
    answers: Array<Answer | null>(total).fill(null),
  };
};

const isRight = (answer: Answer, question: ChordStaffQuestion) =>
  answer.root === spelledName(question.root) && answer.shapeId === question.shape.id;

export default function ChordNameGame({ level }: { level: ChordStaffLevel }) {
  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  /** La fundamental elegida mientras falta la especie. */
  const [draftRoot, setDraftRoot] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // La ronda se sortea con Math.random(): armarla durante el render del
    // servidor daría una distinta al hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(createRound(level));
    setStep(0);
    setDraftRoot(null);
    setGameOver(false);
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
        answer && isRight(answer, round.questions[index]) ? sum + 1 : sum,
      0,
    ) ?? 0;

  const close = (answer: Answer) => {
    if (!round || !question) return;

    const answers = [...round.answers];
    answers[step] = answer;
    setRound({ ...round, answers });

    advanceTimerRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          setStep(step + 1);
          setDraftRoot(null);
        } else {
          setGameOver(true);
        }
      },
      isRight(answer, question) ? 900 : 2000,
    );
  };

  if (!round || !question) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const isCorrect = answered !== null && isRight(answered, question);
  const solution = chordName(question);
  const roots = rootOptions(level);

  // Mientras no se contesta, las notas van en blanco: colorearlas sería medio
  // regalar el acorde.
  const state: NoteState = answered === null ? "idle" : isCorrect ? "correct" : "wrong";
  const columns = [
    question.notes.map((note: SpelledNote) => ({
      degree: note.degree,
      accidental: alterAccidental(note.alter),
      state,
    })),
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-16 md:px-8 md:pb-7 md:pt-20">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href="/play/acordes-pentagrama/nombrar"
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
              ¿Qué <span className="text-amber-300">acorde</span> es?
            </h1>
            <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.28em] text-white/35">
              {level.badge} · {level.title}
            </p>
          </div>

          <span aria-hidden className="w-[42px] md:w-[92px]" />
        </div>

        <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col justify-center pb-8 pt-6 md:pb-10 md:pt-8">
          <div className="mb-7 flex justify-center">
            <div className="w-full max-w-[330px] rounded-3xl border-4 border-white/15 bg-slate-950/70 px-4 py-3 shadow-2xl backdrop-blur-sm">
              <Staff clef={question.clef} columns={columns} label="Acorde en el pentagrama" />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[760px] space-y-3">
            {/* Primero la fundamental, después la especie: es el orden en que se
                lee un acorde, y así la respuesta no se cierra de un clic suelto. */}
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-md md:p-5">
              <p className="mb-3 text-center text-[9px] font-black uppercase tracking-[0.28em] text-white/30">
                Fundamental
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 md:gap-2.5">
                {roots.map((name) => {
                  const chosen = (answered?.root ?? draftRoot) === name;
                  const isSolution =
                    answered !== null && name === spelledName(question.root);

                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={answered !== null || gameOver}
                      onClick={() => setDraftRoot(name)}
                      className={`rounded-xl border py-2.5 text-sm font-black tracking-tight transition active:scale-95 md:py-3 ${
                        isSolution
                          ? "border-emerald-400 bg-emerald-400/25 text-emerald-100"
                          : chosen && answered !== null
                            ? "border-rose-400 bg-rose-500/25 text-rose-100"
                            : chosen
                              ? "border-amber-300 bg-amber-400/25 text-amber-100"
                              : answered !== null
                                ? "border-white/5 bg-white/5 text-white/25"
                                : "border-white/10 bg-white/5 text-white hover:border-amber-300/50 hover:bg-amber-400/20"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-md transition md:p-5 ${
                draftRoot === null && answered === null ? "opacity-35" : ""
              }`}
            >
              <p className="mb-3 text-center text-[9px] font-black uppercase tracking-[0.28em] text-white/30">
                Especie
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-2.5">
                {level.shapes.map((shape) => {
                  const chosen = answered?.shapeId === shape.id;
                  const isSolution = answered !== null && shape.id === question.shape.id;

                  return (
                    <button
                      key={shape.id}
                      type="button"
                      disabled={draftRoot === null || answered !== null || gameOver}
                      onClick={() => close({ root: draftRoot!, shapeId: shape.id })}
                      className={`rounded-xl border py-2.5 text-sm font-black tracking-tight transition active:scale-95 disabled:cursor-default md:py-3 ${
                        isSolution
                          ? "border-emerald-400 bg-emerald-400/25 text-emerald-100"
                          : chosen
                            ? "border-rose-400 bg-rose-500/25 text-rose-100"
                            : answered !== null
                              ? "border-white/5 bg-white/5 text-white/25"
                              : "border-white/10 bg-white/5 text-white hover:border-amber-300/50 hover:bg-amber-400/20"
                      }`}
                    >
                      {shape.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex min-h-[2.5rem] items-center justify-center">
            {answered === null ? (
              <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/25">
                {draftRoot === null
                  ? "Elige la fundamental"
                  : `${draftRoot}… ¿de qué especie?`}
              </p>
            ) : (
              <p
                className={`text-center text-xs font-black uppercase tracking-[0.2em] ${
                  isCorrect ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {isCorrect ? `¡Bien! Era ${solution}` : `Era ${solution}`}
                {question.inversion > 0 && ` · ${question.inversion}ª inversión`}
              </p>
            )}
          </div>
        </main>

        <footer className="pb-4">
          <div className="mb-3 flex flex-wrap justify-center gap-1.5">
            {round.questions.map((item, index) => {
              const given = round.answers[index];
              return (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === step ? "w-5 bg-amber-300" : "w-1.5"
                  } ${
                    given === null
                      ? index === step
                        ? ""
                        : "bg-white/15"
                      : isRight(given, item)
                        ? "bg-emerald-400"
                        : "bg-rose-400"
                  }`}
                />
              );
            })}
          </div>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">
            {step + 1} / {total} · {correctCount}{" "}
            {correctCount === 1 ? "acierto" : "aciertos"}
          </p>
        </footer>
      </div>
    </div>
  );
}
