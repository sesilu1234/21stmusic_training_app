"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import RoundFooter from "@/app/components/RoundFooter";
import PianoKeyboard, { noteName, type KeyMark } from "@/app/components/PianoKeyboard";
import { PRESET_ICONS, PRESETS, useAudio } from "../audio";
import {
  buildMelodyQuiz,
  melodyAnswer,
  melodyNotes,
  melodyTonicChord,
  type MelodyLevel,
  type MelodyQuestion,
} from "@/lib/melodyEar";
import { ROUND_LENGTH } from "@/lib/roundLength";

/** Hueco entre notas de la melodía. */
const GAP_MS = 520;
/** Lo que se espera desde el acorde de tónica hasta la primera nota. */
const TONIC_MS = 1250;

/**
 * El teclado va de una octava por debajo del Do central a dos por encima: es
 * justo el ámbito en el que `melodyEar` mete las melodías.
 */
const KEYBOARD_FROM = -12;
const KEYBOARD_OCTAVES = 3;

interface Round {
  questions: MelodyQuestion[];
  /** Las teclas pulsadas en cada pregunta, sin contar la que va dada. */
  answers: (number[] | null)[];
}

const createRound = (level: MelodyLevel): Round => ({
  questions: buildMelodyQuiz(level, ROUND_LENGTH),
  answers: Array<number[] | null>(ROUND_LENGTH).fill(null),
});

/** Una melodía va en orden: aquí las notas se comparan una a una. */
const isRight = (given: number[], expected: number[]) =>
  given.length === expected.length &&
  given.every((note, index) => note === expected[index]);

export default function MelodyEarGame({
  level,
  backHref,
}: {
  level: MelodyLevel;
  backHref: string;
}) {
  const { playSequence } = useAudio();

  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  /** Las teclas de la pregunta actual, todavía sin corregir. */
  const [draft, setDraft] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  /** true mientras estás mirando una pregunta vieja en vez de jugando. */
  const [reviewing, setReviewing] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);
  /** Qué nota de la melodía va sonando: -1 = ninguna. */
  const [playIndex, setPlayIndex] = useState(-1);

  const advanceTimerRef = useRef<number | null>(null);
  const flashTimersRef = useRef<number[]>([]);
  const autoPlayRef = useRef(true);

  // La ronda se sortea con Math.random(): armarla en el render del servidor
  // daría una distinta al hidratar.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(createRound(level));
    setStep(0);
    setDraft([]);
    setGameOver(false);
    setReviewing(false);
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
  const answered = round?.answers[step] ?? null;
  const correctCount =
    round?.answers.reduce<number>(
      (sum, answer, index) =>
        answer && isRight(answer, melodyAnswer(round.questions[index]))
          ? sum + 1
          : sum,
      0,
    ) ?? 0;

  /** Suena el acorde de tónica y, detrás, la melodía nota a nota. */
  const play = useCallback(
    (target?: MelodyQuestion) => {
      if (!target) return;
      clearFlashTimers();

      const notes = melodyNotes(target);
      playSequence([melodyTonicChord(target)], 0, presetIdx);

      flashTimersRef.current.push(
        window.setTimeout(() => {
          playSequence(
            notes.map((note) => [note]),
            GAP_MS,
            presetIdx,
          );
        }, TONIC_MS),
      );

      notes.forEach((_, index) => {
        flashTimersRef.current.push(
          window.setTimeout(() => setPlayIndex(index), TONIC_MS + index * GAP_MS),
        );
      });
      flashTimersRef.current.push(
        window.setTimeout(() => setPlayIndex(-1), TONIC_MS + notes.length * GAP_MS),
      );
    },
    [playSequence, presetIdx],
  );

  useEffect(() => {
    if (!question || gameOver || !autoPlayRef.current) return;
    autoPlayRef.current = false;
    const timer = window.setTimeout(() => play(question), 200);
    return () => window.clearTimeout(timer);
  }, [question, gameOver, play]);

  /** En qué pregunta va la partida. -1 = ya están todas contestadas. */
  const liveStep = round?.answers.findIndex((answer) => answer === null) ?? 0;

  /**
   * Ir a una pregunta ya contestada para volver a oírla y ver qué teclas
   * pusiste y cuáles eran. No se puede saltar hacia delante.
   */
  const goTo = (index: number) => {
    const last = liveStep === -1 ? total - 1 : liveStep;
    if (index < 0 || index > last || index === step) return;

    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    clearFlashTimers();
    setPlayIndex(-1);
    // Volver a la que está en juego no es revisar: es seguir, y por eso
    // vuelve a sonar sola igual que al llegar a una pregunta nueva.
    const back = index !== last;
    setReviewing(back);
    autoPlayRef.current = !back && liveStep !== -1;
    setStep(index);
    setDraft([]);

    // Ya no quedaba ninguna sin contestar: volver a la última es terminar.
    if (liveStep === -1 && index === total - 1) setGameOver(true);
  };

  const press = (semitone: number) => {
    if (!round || !question || answered !== null || gameOver) return;

    const expected = melodyAnswer(question);
    const next = [...draft, semitone];

    // Se oye cada tecla al pulsarla: si no, se contesta a ciegas.
    playSequence([[semitone]], 0, presetIdx);

    if (next.length < expected.length) {
      setDraft(next);
      return;
    }

    const answers = [...round.answers];
    answers[step] = next;
    setRound({ ...round, answers });
    setDraft(next);

    const correct = isRight(next, expected);
    // Al acertar se oye la melodía entera: es la recompensa del ejercicio.
    if (correct) {
      flashTimersRef.current.push(window.setTimeout(() => play(question), 400));
    }

    advanceTimerRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          autoPlayRef.current = true;
          setStep(step + 1);
          setDraft([]);
        } else {
          setGameOver(true);
        }
      },
      correct ? 1200 + (level.notes + 1) * GAP_MS + TONIC_MS : 2600,
    );
  };

  /** Quita la última tecla, mientras la respuesta no esté cerrada. */
  const undo = () => {
    if (answered !== null || !draft.length) return;
    setDraft(draft.slice(0, -1));
  };

  if (!round || !question) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const notes = melodyNotes(question);
  const expected = melodyAnswer(question);
  const correct = answered !== null ? isRight(answered, expected) : null;

  // La primera nota va siempre marcada en ámbar: es la que se da hecha.
  const marks: Record<number, KeyMark> = { [notes[0]]: "root" };
  if (answered === null) {
    draft.forEach((note) => {
      if (note !== notes[0]) marks[note] = "hint";
    });
  } else {
    expected.forEach((note) => {
      marks[note] = "correct";
    });
    answered.forEach((note) => {
      if (!expected.includes(note)) marks[note] = "wrong";
    });
  }

  const remaining = expected.length - draft.length;

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-16 md:px-8 md:pb-7 md:pt-20">
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
              Saca la <span className="text-violet-300">MELODÍA</span>
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

        <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col justify-center pb-8 pt-6 md:pb-10 md:pt-8">
          <p className="mb-4 text-center text-xs text-white/35">
            Suena el acorde de la tonalidad y después la melodía. La primera
            nota va dada: toca las demás en el piano.
          </p>

          {/* Una casilla por nota. La primera ya viene puesta. */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {notes.map((note, index) => {
              const sounding = playIndex === index;
              if (index === 0) {
                return (
                  <span
                    key={index}
                    className={`grid h-11 min-w-[3.25rem] place-items-center rounded-xl border px-2 text-sm font-black transition ${
                      sounding
                        ? "scale-110 border-amber-200 bg-amber-200 text-black"
                        : "border-amber-300/50 bg-amber-400/20 text-amber-100"
                    }`}
                  >
                    {noteName(note)}
                  </span>
                );
              }

              const given = answered
                ? expected[index - 1]
                : draft[index - 1];
              const filled = given !== undefined;

              return (
                <span
                  key={index}
                  className={`grid h-11 min-w-[3.25rem] place-items-center rounded-xl border px-2 text-sm font-black transition ${
                    sounding
                      ? "scale-110 border-violet-200 bg-violet-200 text-black"
                      : !filled
                        ? "border-dashed border-white/15 bg-white/[0.03] text-white/20"
                        : answered === null
                          ? "border-sky-300/50 bg-sky-400/15 text-sky-100"
                          : answered[index - 1] === expected[index - 1]
                            ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                            : "border-amber-400/50 bg-amber-400/15 text-amber-100"
                  }`}
                >
                  {filled ? noteName(given) : index + 1}
                </span>
              );
            })}
          </div>

          <PianoKeyboard
            from={KEYBOARD_FROM}
            octaves={KEYBOARD_OCTAVES}
            marks={marks}
            onPress={press}
            disabled={answered !== null || gameOver}
          />

          <div className="mt-6 flex min-h-[2.5rem] flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => play(question)}
              className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-violet-100 transition hover:border-violet-300/60 hover:bg-violet-400/20"
            >
              {answered === null ? <RotateCw size={13} /> : <Volume2 size={13} />}
              {answered === null ? "Escuchar" : "Oírla"}
            </button>

            {answered === null ? (
              <>
                <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/25">
                  Faltan {remaining}
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
                  correct ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {correct
                  ? "¡Bien!"
                  : `Dijiste ${(answered ?? []).map(noteName).join(" · ")}`}
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
            return given === null ? null : isRight(given, melodyAnswer(item));
          })}
          correctCount={correctCount}
          reviewing={reviewing}
          onGoTo={goTo}
        />
      </div>
    </div>
  );
}
