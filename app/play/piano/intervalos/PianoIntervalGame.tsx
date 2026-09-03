"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2 } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import RoundFooter from "@/app/components/RoundFooter";
import PianoKeyboard, { noteName, type KeyMark } from "@/app/components/PianoKeyboard";
import { PRESET_ICONS, PRESETS, useAudio } from "@/app/play/oido/audio";
import {
  buildPianoIntervalQuiz,
  type PianoIntervalLevel,
  type PianoIntervalQuestion,
} from "@/lib/pianoIntervals";
import { ROUND_LENGTH } from "@/lib/roundLength";

/** Hueco entre la nota de partida y la que se acaba de pulsar. */
const GAP_MS = 480;

interface Round {
  questions: PianoIntervalQuestion[];
  /** Semitono pulsado en cada pregunta, o null si aún no se ha contestado. */
  answers: (number | null)[];
}

const createRound = (level: PianoIntervalLevel): Round => {
  const total = ROUND_LENGTH;
  return {
    questions: buildPianoIntervalQuiz(level, total),
    answers: Array<number | null>(total).fill(null),
  };
};

const targetOf = (question: PianoIntervalQuestion) =>
  question.root + question.interval.semitones;

export default function PianoIntervalGame({ level }: { level: PianoIntervalLevel }) {
  const { playSequence } = useAudio();

  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  /** true mientras estás mirando una pregunta vieja en vez de jugando. */
  const [reviewing, setReviewing] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);

  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // La ronda se arma en un efecto porque se sortea con Math.random():
    // hacerlo en el render del servidor daría una distinta al hidratar.
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
        answer !== null && answer === targetOf(round.questions[index]) ? sum + 1 : sum,
      0,
    ) ?? 0;

  /** Suena la nota de partida sola, como referencia. */
  const playRoot = useCallback(
    (target?: PianoIntervalQuestion) => {
      if (!target) return;
      playSequence([[target.root]], GAP_MS, presetIdx);
    },
    [playSequence, presetIdx],
  );

  const press = (semitone: number) => {
    if (!round || !question || answered !== null || gameOver) return;

    const answers = [...round.answers];
    answers[step] = semitone;
    setRound({ ...round, answers });

    // Se oye siempre lo que se ha tocado, acierto o fallo: escuchar el error
    // enseña tanto como verlo en rojo.
    playSequence([[question.root], [semitone]], GAP_MS, presetIdx);

    const isCorrect = semitone === targetOf(question);
    advanceTimerRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          setStep(step + 1);
        } else {
          setGameOver(true);
        }
      },
      isCorrect ? 900 : 1700,
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

  const target = targetOf(question);
  const isCorrect = answered === target;

  // Marcas del teclado: la de partida siempre; al contestar se añade la
  // correcta en verde y, si se ha fallado, la pulsada en rojo.
  const marks: Record<number, KeyMark> = { [question.root]: "root" };
  if (answered !== null) {
    marks[target] = "correct";
    if (!isCorrect) marks[answered] = "wrong";
  }

  const badges: Record<number, string> = { [question.root]: "Desde aquí" };
  if (answered !== null) badges[target] = question.interval.short;

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-4 md:px-8 md:pb-7 md:pt-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href="/play/piano/intervalos"
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
              Desde <span className="text-amber-300">{noteName(question.root)}</span>,
              toca la <span className="text-emerald-300">{question.interval.name}</span>
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
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => playRoot(question)}
              className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-300/60 hover:bg-amber-400/20"
            >
              <Volume2 size={14} strokeWidth={1.8} />
              Oír {noteName(question.root)}
            </button>
          </div>

          {/* pt-9: hueco para que los globitos de las teclas no se corten. */}
          <div className="pt-9">
            <PianoKeyboard
              from={0}
              octaves={2}
              marks={marks}
              badges={badges}
              onPress={press}
              disabled={answered !== null || gameOver}
            />
          </div>

          <p
            className={`mt-6 text-center text-xs font-black uppercase tracking-[0.2em] transition-opacity ${
              answered === null
                ? "opacity-0"
                : isCorrect
                  ? "text-emerald-300 opacity-100"
                  : "text-rose-300 opacity-100"
            }`}
          >
            {answered === null
              ? "·"
              : isCorrect
                ? "¡Bien!"
                : `Era ${noteName(target)}, no ${noteName(answered)}`}
          </p>
        </main>

        <RoundFooter
          step={step}
          total={total}
          liveStep={liveStep}
          results={round.questions.map((item, index) => {
            const given = round.answers[index];
            return given === null ? null : given === targetOf(item);
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
