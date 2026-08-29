"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import Staff, { type StaffColumn } from "@/app/components/Staff";
import { alterAccidental } from "@/lib/staff";
import {
  ANSWER_NAMES,
  buildChordStaffQuiz,
  chordName,
  chordNoteNames,
  stackNoteNames,
  type ChordStaffLevel,
  type ChordStaffQuestion,
} from "@/lib/staffChords";
import { ROUND_LENGTH } from "@/lib/roundLength";

interface Round {
  questions: ChordStaffQuestion[];
  /** Los nombres de nota dichos en cada pregunta, en el orden en que se dijeron. */
  answers: (string[] | null)[];
}

const createRound = (level: ChordStaffLevel): Round => {
  const total = ROUND_LENGTH;
  return {
    questions: buildChordStaffQuiz(level, total),
    answers: Array<string[] | null>(total).fill(null),
  };
};

/** Un acorde suena a la vez, así que da igual en qué orden se digan sus notas. */
const isRight = (given: string[], expected: string[]) =>
  given.length === expected.length &&
  [...given].sort().every((name, index) => name === [...expected].sort()[index]);

export default function ChordSpellGame({ level }: { level: ChordStaffLevel }) {
  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  /** Las notas dichas en la pregunta actual, todavía sin corregir. */
  const [draft, setDraft] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // La ronda se sortea con Math.random(): armarla durante el render del
    // servidor daría una distinta al hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(createRound(level));
    setStep(0);
    setDraft([]);
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
        answer && isRight(answer, chordNoteNames(round.questions[index])) ? sum + 1 : sum,
      0,
    ) ?? 0;

  const press = (name: string) => {
    if (!round || !question || answered !== null || gameOver) return;

    const expected = chordNoteNames(question);
    const next = [...draft, name];
    setDraft(next);

    if (next.length < expected.length) return;

    const answers = [...round.answers];
    answers[step] = next;
    setRound({ ...round, answers });

    advanceTimerRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          setStep(step + 1);
          setDraft([]);
        } else {
          setGameOver(true);
        }
      },
      isRight(next, expected) ? 1400 : 2400,
    );
  };

  /** Quita la última nota, mientras la respuesta no esté cerrada. */
  const undo = () => {
    if (answered !== null || !draft.length) return;
    setDraft(draft.slice(0, -1));
  };

  if (!round || !question) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const expected = chordNoteNames(question);
  const isCorrect = answered !== null && isRight(answered, expected);
  const remaining = expected.length - draft.length;

  // El pentagrama se va llenando con lo que dice el alumno: las notas aparecen
  // apiladas de grave a agudo en el orden en que las va eligiendo. Al corregir,
  // verde las que van y rojo las que no.
  const stacked = stackNoteNames(draft, question.clef);
  const columns: StaffColumn[] = stacked.length
    ? [
        stacked.map((note, index) => ({
          degree: note.degree,
          accidental: alterAccidental(note.alter),
          state:
            answered === null
              ? ("hint" as const)
              : expected.includes(draft[index])
                ? ("correct" as const)
                : ("wrong" as const),
        })),
      ]
    : [];

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-16 md:px-8 md:pb-7 md:pt-20">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href="/play/acordes-pentagrama/escribir"
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
              Escribe <span className="text-amber-300">{chordName(question)}</span>
            </h1>
            <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.28em] text-white/35">
              {level.badge} · {level.title}
            </p>
          </div>

          <span aria-hidden className="w-[42px] md:w-[92px]" />
        </div>

        <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col justify-center pb-8 pt-6 md:pb-10 md:pt-8">
          <div className="mb-5 flex justify-center">
            <div className="w-full max-w-[330px] rounded-3xl border-4 border-white/15 bg-slate-950/70 px-4 py-3 shadow-2xl backdrop-blur-sm">
              <Staff clef={question.clef} columns={columns} label="Acorde en el pentagrama" />
            </div>
          </div>

          {/* Una casilla por nota que hay que decir. */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {expected.map((_, index) => {
              const given = draft[index];
              const wrongHere = answered !== null && !expected.includes(given);

              return (
                <span
                  key={index}
                  className={`grid h-11 min-w-[3.5rem] place-items-center rounded-xl border px-2 text-sm font-black transition ${
                    given === undefined
                      ? "border-dashed border-white/15 bg-white/[0.03] text-white/20"
                      : answered === null
                        ? "border-sky-300/50 bg-sky-400/15 text-sky-100"
                        : wrongHere
                          ? "border-rose-400/50 bg-rose-400/15 text-rose-100"
                          : "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                  }`}
                >
                  {given ?? index + 1}
                </span>
              );
            })}
          </div>

          <div className="mx-auto w-full max-w-[760px] rounded-[2rem] border border-white/10 bg-slate-950/50 p-4 backdrop-blur-md md:p-6">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-9 md:gap-2.5">
              {ANSWER_NAMES.map((name) => {
                const used = draft.includes(name);

                return (
                  <button
                    key={name}
                    type="button"
                    disabled={answered !== null || gameOver || used}
                    onClick={() => press(name)}
                    className={`rounded-xl border py-2.5 text-xs font-black tracking-tight transition active:scale-95 disabled:cursor-default md:py-3 md:text-sm ${
                      used
                        ? "border-sky-300/40 bg-sky-400/15 text-sky-100"
                        : answered !== null
                          ? "border-white/5 bg-white/5 text-white/20"
                          : "border-white/10 bg-white/5 text-white hover:border-amber-300/50 hover:bg-amber-400/20"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex min-h-[2.5rem] flex-wrap items-center justify-center gap-3">
            {answered === null ? (
              <>
                <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/25">
                  Di sus notas · faltan {remaining}
                </p>
                <button
                  type="button"
                  onClick={undo}
                  disabled={!draft.length}
                  className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white/35 transition hover:text-white/70 disabled:cursor-default disabled:opacity-25 disabled:hover:text-white/35"
                >
                  <RotateCcw size={12} />
                  Borrar
                </button>
              </>
            ) : (
              <p
                className={`text-center text-xs font-black uppercase tracking-[0.2em] ${
                  isCorrect ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {isCorrect ? "¡Bien!" : `Era ${expected.join(" · ")}`}
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
                      : isRight(given, chordNoteNames(item))
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
