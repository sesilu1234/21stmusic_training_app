"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import { PRESET_ICONS, PRESETS, useAudio } from "./audio";
import {
  buildChordQuiz,
  chordNotes,
  tonicChord,
  type ChordLevel,
  type ChordOption,
  type ChordQuestion,
} from "@/lib/chordEar";
import { ROUND_LENGTH } from "@/lib/roundLength";

/** Hueco entre un acorde y el siguiente. */
const GAP_MS = 1150;
/** Lo que dura encendida la casilla del último acorde. */
const TAIL_MS = 950;

interface Round {
  questions: ChordQuestion[];
  /** Una respuesta por pregunta: la lista de ids elegidos, en orden. */
  answers: (string[] | null)[];
}

const createRound = (level: ChordLevel): Round => {
  const total = ROUND_LENGTH;
  return {
    questions: buildChordQuiz(level, total),
    answers: Array<string[] | null>(total).fill(null),
  };
};

const sameSequence = (a: string[], b: ChordOption[]) =>
  a.length === b.length && a.every((id, index) => id === b[index].id);

export default function ChordEarGame({
  level,
  backHref,
}: {
  level: ChordLevel;
  /** Menú de niveles del modo al que pertenece. */
  backHref: string;
}) {
  const { playSequence } = useAudio();

  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  /** Lo que lleva elegido en la pregunta actual, todavía sin corregir. */
  const [draft, setDraft] = useState<string[]>([]);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [gameOver, setGameOver] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);
  /** 0 = nada encendido. 1 = tónica (o el acorde en modo calidad). 2… = acordes. */
  const [playFlash, setPlayFlash] = useState(0);

  const advanceTimerRef = useRef<number | null>(null);
  const flashTimersRef = useRef<number[]>([]);
  const autoPlayRef = useRef(true);

  const withTonic = level.mode === "grado";
  const slots = level.length;

  // La ronda se arma en un efecto, no al inicializar el estado, porque
  // La ronda se sortea con Math.random(): armarla durante el render del
  // servidor daría un desajuste de hidratación. Pasa una vez al montar, así
  // que el render de más no importa.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(createRound(level));
    setStep(0);
    setDraft([]);
    setAnswerState("idle");
    setGameOver(false);
    autoPlayRef.current = true;
  }, [level]);

  const clearFlashTimers = () => {
    flashTimersRef.current.forEach((id) => window.clearTimeout(id));
    flashTimersRef.current = [];
  };

  useEffect(
    () => () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      clearFlashTimers();
    },
    [],
  );

  const total = round?.questions.length ?? 0;
  const question = round?.questions[step];
  const correctCount =
    round?.answers.reduce<number>(
      (sum, answer, index) =>
        answer && sameSequence(answer, round.questions[index].options) ? sum + 1 : sum,
      0,
    ) ?? 0;

  const play = useCallback(
    (target?: ChordQuestion) => {
      if (!target) return;
      clearFlashTimers();

      // Los acordes que suenan: en modo grado, primero la tónica de referencia.
      const sequence = target.options.map((option) => chordNotes(option, target.keyRoot));
      const chords = withTonic ? [tonicChord(target.keyRoot), ...sequence] : sequence;

      // Se enciende una casilla por acorde, al ritmo al que van sonando.
      setPlayFlash(1);
      chords.forEach((_, index) => {
        if (index === 0) return;
        flashTimersRef.current.push(
          window.setTimeout(() => setPlayFlash(index + 1), index * GAP_MS),
        );
      });
      flashTimersRef.current.push(
        window.setTimeout(
          () => setPlayFlash(0),
          (chords.length - 1) * GAP_MS + TAIL_MS,
        ),
      );

      playSequence(chords, GAP_MS, presetIdx);
    },
    [withTonic, playSequence, presetIdx],
  );

  // Suena sola al llegar a cada pregunta nueva, pero no al volver de un
  // cambio de instrumento ni tras responder.
  useEffect(() => {
    if (!question || gameOver || !autoPlayRef.current) return;
    autoPlayRef.current = false;
    const timer = window.setTimeout(() => play(question), 150);
    return () => window.clearTimeout(timer);
  }, [question, gameOver, play]);

  const answered = round?.answers[step] ?? null;

  const choose = (optionId: string) => {
    if (!round || !question || answered || gameOver) return;

    const next = [...draft, optionId];

    // Todavía faltan acordes por decir: se guarda y se espera.
    if (next.length < slots) {
      setDraft(next);
      return;
    }

    // Secuencia completa: se corrige.
    const answers = [...round.answers];
    answers[step] = next;
    setRound({ ...round, answers });
    setDraft(next);
    setAnswerState(sameSequence(next, question.options) ? "correct" : "wrong");

    advanceTimerRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          autoPlayRef.current = true;
          setStep(step + 1);
          setDraft([]);
          setAnswerState("idle");
        } else {
          setGameOver(true);
        }
      },
      slots > 1 ? 1600 : 1000,
    );
  };

  /** Borra el último acorde elegido, mientras la respuesta no esté cerrada. */
  const undo = () => {
    if (answered || !draft.length) return;
    setDraft(draft.slice(0, -1));
  };

  if (!round || !question) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const answerGridClass =
    level.options.length === 2
      ? "grid-cols-2"
      : level.options.length === 3
        ? "grid-cols-3"
        : level.options.length === 4
          ? "grid-cols-2 sm:grid-cols-4"
          : level.options.length >= 5
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3";

  // Con la respuesta cerrada se apagan todos los botones: la corrección se lee
  // en las casillas de arriba, que es donde está el orden.
  const optionClass = answered
    ? "border-white/5 bg-white/[0.02] text-white/25"
    : "border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-white/10";

  /**
   * Cuál es la casilla que se está contestando ahora mismo. `draft` se rellena
   * en orden, así que la que toca es siempre la primera vacía. -1 = ninguna,
   * porque la respuesta ya está cerrada.
   */
  const askingIndex = answered ? -1 : draft.length;

  /** Estado de la casilla i (0-based) de la secuencia. */
  const slotClass = (index: number) => {
    const lit = playFlash === index + (withTonic ? 2 : 1);
    if (lit) return "scale-110 border-black bg-sky-400 text-black shadow-[4px_4px_0px_#000]";

    if (answered) {
      const given = answered[index];
      const expected = question.options[index].id;
      return given === expected
        ? "border-emerald-500 bg-emerald-300 text-black shadow-[4px_4px_0px_rgba(0,0,0,0.25)]"
        : "border-rose-500 bg-rose-300 text-black shadow-[4px_4px_0px_rgba(0,0,0,0.25)]";
    }

    if (draft[index]) {
      return "border-black bg-violet-300 text-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)]";
    }

    // La que toca contestar. Sin esto, en una progresión de tres o cuatro
    // acordes todas las vacías se ven igual y no sabes por cuál vas.
    if (index === askingIndex) {
      return "scale-105 border-violet-500 bg-white text-black/25 shadow-[4px_4px_0px_rgba(124,58,237,0.5)] ring-4 ring-violet-400/25";
    }

    return "border-black/25 bg-white text-black/15 shadow-[4px_4px_0px_rgba(0,0,0,0.10)]";
  };

  /** Lo que se escribe dentro de la casilla i. */
  const slotLabel = (index: number) => {
    const chosen = answered?.[index] ?? draft[index];
    if (!chosen) return "♩";
    return level.options.find((option) => option.id === chosen)?.label ?? chosen;
  };

  const heading =
    level.mode === "grado"
      ? slots > 1
        ? { lead: "¿Qué", word: "PROGRESIÓN", tail: "es?" }
        : { lead: "¿Qué", word: "GRADO", tail: "es?" }
      : { lead: "¿Qué", word: "ACORDE", tail: "es?" };

  const expectedLabels = question.options.map((option) => option.label).join(" · ");

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[960px] flex-col px-4 pb-5 pt-16 md:px-8 md:pb-7 md:pt-20">
        {/* Cabecera compacta: baja lo suficiente para quedar unida al bloque del juego. */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href={backHref}
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
              {heading.lead} <span className="text-violet-300">{heading.word}</span>{" "}
              {heading.tail}
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
          {withTonic && (
            <p className="mb-3 text-center text-xs text-white/35">
              {slots > 1
                ? `La tónica te la damos de referencia; después suenan ${slots} acordes. Dilos en orden.`
                : "La tónica te la damos de referencia; después suena el acorde."}
            </p>
          )}

          <div className="mb-7 flex flex-col items-center gap-4">
            <div className="relative flex w-full max-w-[620px] flex-col items-center">
              <div className="relative flex min-h-[190px] w-full items-center justify-center overflow-hidden rounded-[2.25rem] border-4 border-white bg-white px-5 py-6 shadow-2xl md:min-h-[230px] md:rounded-[3rem]">
                <div className="absolute right-7 top-5 text-2xl font-black italic text-black/10">
                  #{step + 1}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                  {withTonic && (
                    <>
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-600/70">
                          Tónica
                        </span>
                        {/* Va en ámbar y con su grado escrito desde el
                            principio: es un dato que te dan, no una casilla
                            que haya que rellenar. Antes salía blanca y con la
                            misma corchea que las casillas vacías, así que
                            parecía una pregunta más. */}
                        <div
                          className={`relative grid h-16 w-16 place-items-center rounded-3xl border-2 text-2xl font-black italic shadow-xl transition md:h-20 md:w-20 md:text-3xl ${
                            playFlash === 1
                              ? "scale-110 border-black bg-amber-300 text-black shadow-[5px_5px_0px_#000]"
                              : "border-amber-400/70 bg-amber-200/90 text-black/60 shadow-[5px_5px_0px_rgba(0,0,0,0.12)]"
                          }`}
                        >
                          I
                        </div>
                      </div>

                      <div className="text-3xl font-black italic text-black/15">→</div>
                    </>
                  )}

                  <div className="flex flex-col items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-black/30">
                      {slots > 1 ? "Progresión" : "Acorde"}
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
                      {Array.from({ length: slots }).map((_, index) => (
                        <div key={index} className="flex flex-col items-center gap-1.5">
                          {slots > 1 && (
                            <span
                              className={`text-[8px] uppercase tracking-[0.18em] md:text-[9px] ${
                                index === askingIndex
                                  ? "font-black text-violet-600"
                                  : "font-semibold text-black/35"
                              }`}
                            >
                              {index + 1}º
                            </span>
                          )}
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-lg font-black italic transition md:h-[64px] md:w-[64px] md:text-xl ${slotClass(index)}`}
                          >
                            {slotLabel(index)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
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

              {/* Solo tiene sentido con varias casillas: con una, elegir ya corrige. */}
              {slots > 1 && (
                <button
                  type="button"
                  onClick={undo}
                  disabled={Boolean(answered) || !draft.length}
                  className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/35 transition hover:text-white/70 disabled:cursor-default disabled:opacity-25 disabled:hover:text-white/35"
                >
                  <RotateCcw size={12} />
                  Borrar
                </button>
              )}
            </div>
          </div>

          <div className={`mx-auto grid w-full max-w-[620px] gap-3 ${answerGridClass}`}>
            {level.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option.id)}
                disabled={Boolean(answered)}
                className={`min-h-[64px] rounded-2xl border px-3 py-4 text-lg font-black tracking-tight backdrop-blur-sm transition duration-150 disabled:cursor-default md:text-xl ${optionClass}`}
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
            {answerState === "correct" ? (
              "¡Bien!"
            ) : (
              <>
                Era{" "}
                {/* normal-case: en mayúsculas un "ii" se leería "II", que es
                    otro acorde, y un "b3" se leería "B3", que es otra nota. */}
                <span className="normal-case">{expectedLabels}</span>
              </>
            )}
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
                      : sameSequence(given, item.options)
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
