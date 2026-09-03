"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Volume2 } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import RoundFooter from "@/app/components/RoundFooter";
import PianoKeyboard, { noteName, type KeyMark } from "@/app/components/PianoKeyboard";
import { PRESET_ICONS, PRESETS, useAudio } from "@/app/play/oido/audio";
import {
  buildNotes,
  buildQuiz,
  type BuildLevel,
  type BuildQuestion,
} from "@/lib/pianoBuild";
import { ROUND_LENGTH } from "@/lib/roundLength";

interface Round {
  questions: BuildQuestion[];
  /** Las teclas pulsadas en cada pregunta, en el orden en que se pulsaron. */
  answers: (number[] | null)[];
}

const createRound = (level: BuildLevel): Round => {
  const total = ROUND_LENGTH;
  return {
    questions: buildQuiz(level, total),
    answers: Array<number[] | null>(total).fill(null),
  };
};

/**
 * ¿Está bien la respuesta?
 *
 * Un acorde suena a la vez, así que da igual el orden en que se pulsen sus
 * notas. Una escala se toca subiendo, y ahí el orden es medio ejercicio.
 *
 * Y en el acorde da igual también la octava. Antes se comparaban semitonos
 * absolutos, y como la pregunta se genera siempre con la fundamental en la
 * octava de abajo, el teclado te obligaba a tocarlo ahí: el mismo acorde una
 * octava más arriba, que musicalmente es el mismo acorde, se contaba como
 * fallo. Ahora se comparan clases de altura (el semitono módulo 12), que es lo
 * que de verdad define un acorde. Se ordenan y se comparan como conjunto, así
 * que Do-Mi-Sol vale tocado donde sea y en el orden que sea.
 *
 * En las escalas no se toca nada: ahí el ejercicio es tocarla entera y seguida
 * desde su fundamental, y perdonar la octava sería perdonar justo eso.
 */
const isRight = (given: number[], expected: number[], kind: BuildLevel["kind"]) => {
  if (given.length !== expected.length) return false;
  if (kind === "escala") return given.every((note, index) => note === expected[index]);

  const sortedGiven = [...given].map((note) => note % 12).sort((a, b) => a - b);
  const sortedExpected = [...expected].map((note) => note % 12).sort((a, b) => a - b);
  return sortedGiven.every((note, index) => note === sortedExpected[index]);
};

export default function PianoBuildGame({
  level,
  backHref,
}: {
  level: BuildLevel;
  backHref: string;
}) {
  const { playSequence } = useAudio();

  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  /** Teclas de la pregunta actual, todavía sin corregir. */
  const [draft, setDraft] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  /** true mientras estás mirando una pregunta vieja en vez de jugando. */
  const [reviewing, setReviewing] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);

  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // La ronda se sortea con Math.random(): armarla durante el render del
    // servidor daría una distinta al hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(createRound(level));
    setStep(0);
    setDraft([]);
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
        answer &&
        isRight(answer, buildNotes(round.questions[index]), level.kind)
          ? sum + 1
          : sum,
      0,
    ) ?? 0;

  /** Un acorde suena junto; una escala, una nota detrás de otra. */
  const playAnswer = useCallback(
    (notes: number[]) => {
      if (level.kind === "acorde") {
        playSequence([notes], 0, presetIdx);
      } else {
        playSequence(
          notes.map((note) => [note]),
          260,
          presetIdx,
        );
      }
    },
    [level.kind, playSequence, presetIdx],
  );

  const press = (semitone: number) => {
    if (!round || !question || answered !== null || gameOver) return;

    const expected = buildNotes(question);
    const next = [...draft, semitone];

    // Se oye cada tecla al pulsarla: montar el acorde a ciegas no enseña nada.
    playSequence([[semitone]], 0, presetIdx);

    if (next.length < expected.length) {
      setDraft(next);
      return;
    }

    const answers = [...round.answers];
    answers[step] = next;
    setRound({ ...round, answers });
    setDraft(next);

    const correct = isRight(next, expected, level.kind);
    // Al acertar se oye la cosa entera, que es la recompensa del ejercicio.
    if (correct) window.setTimeout(() => playAnswer(expected), 260);

    advanceTimerRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          setStep(step + 1);
          setDraft([]);
        } else {
          setGameOver(true);
        }
      },
      correct ? 1700 : 2300,
    );
  };

  /** Quita la última tecla, mientras la respuesta no esté cerrada. */
  const undo = () => {
    if (answered !== null || !draft.length) return;
    setDraft(draft.slice(0, -1));
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
    setDraft([]);

    // Si ya no queda ninguna sin contestar, volver a la última es terminar:
    // el avance que iba a cerrar la partida lo hemos cancelado nosotros.
    if (liveStep === -1 && index === total - 1) setGameOver(true);
  };

  if (!round || !question) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const expected = buildNotes(question);
  const isCorrect = answered !== null && isRight(answered, expected, level.kind);

  // Mientras construyes, tus teclas en cian. Al corregir: verde las que van y
  // rojo las que has pulsado de más.
  //
  // En los acordes la comparación es por clase de altura, así que la corrección
  // tiene que serlo también: si has tocado el acorde bien pero una octava más
  // arriba, esas teclas son las buenas y van en verde donde las has tocado. Si
  // se marcaran solo las de `expected`, que están siempre en la octava de
  // abajo, verías verde donde no has tocado y rojo donde sí, justo después de
  // que el juego te haya dado la respuesta por buena.
  const sameNote = (a: number, b: number) =>
    level.kind === "acorde" ? a % 12 === b % 12 : a === b;

  const marks: Record<number, KeyMark> = {};
  if (answered === null) {
    draft.forEach((note) => {
      marks[note] = "hint";
    });
  } else {
    // Primero la referencia: dónde estaban las notas que había que tocar. Así
    // una que te hayas dejado se sigue viendo.
    expected.forEach((note) => {
      marks[note] = "correct";
    });
    answered.forEach((note) => {
      marks[note] = expected.some((wanted) => sameNote(note, wanted))
        ? "correct"
        : "wrong";
    });
  }

  // "Monta Do mayor" / "Toca la escala de Do pentatónica menor".
  const targetName = `${noteName(question.root)} ${question.shape.label}`;
  const remaining = expected.length - draft.length;

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-4 md:px-8 md:pb-7 md:pt-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href={backHref}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/50 px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60 backdrop-blur-sm transition hover:border-emerald-300/50 hover:text-white md:px-4"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Niveles</span>
          </Link>

          <div className="min-w-0 text-center">
            <h1
              className="text-balance text-xl font-black italic uppercase leading-tight tracking-tighter text-white sm:text-2xl md:text-3xl"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              {level.kind === "acorde" ? "Monta" : "Toca la escala de"}{" "}
              {/* normal-case: el titular va en mayúsculas y el cifrado
                  distingue mayúsculas de minúsculas — "m7b5" en mayúsculas se
                  lee "M7B5", que es otro acorde. Ver lib/chordNames.ts. */}
              <span className="normal-case text-emerald-300">{targetName}</span>
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
                  presetIdx === index ? "bg-emerald-400/25" : "opacity-40 hover:opacity-80"
                }`}
              >
                {PRESET_ICONS[index]}
              </button>
            ))}
          </div>
        </div>

        <main className="mx-auto flex w-full max-w-[980px] flex-1 flex-col justify-center pb-8 pt-6 md:pb-10 md:pt-8">
          {/* Casillas: una por nota que hay que pulsar. */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {expected.map((note, index) => {
              const given = answered?.[index] ?? draft[index];
              const filled = given !== undefined;
              const wrongHere =
                answered !== null && !isRight(answered, expected, level.kind);

              return (
                <span
                  key={index}
                  className={`grid h-11 min-w-[3.25rem] place-items-center rounded-xl border px-2 text-sm font-black transition ${
                    !filled
                      ? "border-dashed border-white/15 bg-white/[0.03] text-white/20"
                      : answered === null
                        ? "border-sky-300/50 bg-sky-400/15 text-sky-100"
                        : wrongHere
                          ? "border-rose-400/50 bg-rose-400/15 text-rose-100"
                          : "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                  }`}
                >
                  {filled ? noteName(given) : index + 1}
                </span>
              );
            })}
          </div>

          <PianoKeyboard
            from={0}
            octaves={2}
            marks={marks}
            onPress={press}
            disabled={answered !== null || gameOver}
          />

          <div className="mt-6 flex min-h-[2.5rem] flex-wrap items-center justify-center gap-3">
            {answered === null ? (
              <>
                <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/25">
                  {level.kind === "escala"
                    ? `Súbela entera · faltan ${remaining}`
                    : `Pulsa sus notas · faltan ${remaining}`}
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
              <>
                <p
                  className={`text-center text-xs font-black uppercase tracking-[0.2em] ${
                    isCorrect ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {isCorrect ? "¡Bien!" : "Era esto"}
                </p>
                <button
                  type="button"
                  onClick={() => playAnswer(expected)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/50 transition hover:border-emerald-300/50 hover:text-white"
                >
                  <Volume2 size={12} />
                  Oír
                </button>
              </>
            )}
          </div>
        </main>

        <RoundFooter
          step={step}
          total={total}
          liveStep={liveStep}
          results={round.questions.map((item, index) => {
            const given = round.answers[index];
            return given === null ? null : isRight(given, buildNotes(item), level.kind);
          })}
          correctCount={correctCount}
          reviewing={reviewing}
          onGoTo={goTo}
          accent="emerald"
        />
      </div>
    </div>
  );
}
