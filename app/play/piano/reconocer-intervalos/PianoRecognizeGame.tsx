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
  PIANO_INTERVALS,
  buildPianoIntervalQuiz,
  type PianoIntervalLevel,
  type PianoIntervalQuestion,
} from "@/lib/pianoIntervals";
import { ROUND_LENGTH } from "@/lib/roundLength";

/** Hueco entre las dos notas cuando se escuchan melódicas. */
const GAP_MS = 480;

interface Round {
  questions: PianoIntervalQuestion[];
  /** Semitonos del intervalo elegido en cada pregunta. */
  answers: (number | null)[];
}

const createRound = (level: PianoIntervalLevel): Round => {
  const total = ROUND_LENGTH;
  return {
    questions: buildPianoIntervalQuiz(level, total),
    answers: Array<number | null>(total).fill(null),
  };
};

export default function PianoRecognizeGame({ level }: { level: PianoIntervalLevel }) {
  const { playSequence } = useAudio();

  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
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
        answer !== null && answer === round.questions[index].interval.semitones
          ? sum + 1
          : sum,
      0,
    ) ?? 0;

  /** Las dos notas, una detrás de otra. */
  const play = useCallback(
    (target?: PianoIntervalQuestion) => {
      if (!target) return;
      playSequence(
        [[target.root], [target.root + target.interval.semitones]],
        GAP_MS,
        presetIdx,
      );
    },
    [playSequence, presetIdx],
  );

  const choose = (semitones: number) => {
    if (!round || !question || answered !== null || gameOver) return;

    const answers = [...round.answers];
    answers[step] = semitones;
    setRound({ ...round, answers });
    play(question);

    const isCorrect = semitones === question.interval.semitones;
    advanceTimerRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          setStep(step + 1);
        } else {
          setGameOver(true);
        }
      },
      isCorrect ? 1100 : 1800,
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

  const target = question.root + question.interval.semitones;
  const isCorrect = answered === question.interval.semitones;

  // Las dos teclas del intervalo, encendidas desde el principio: aquí lo que
  // se pregunta es la distancia, no dónde están.
  const marks: Record<number, KeyMark> = {
    [question.root]: "hint",
    [target]: "hint",
  };
  const badges: Record<number, string> = {
    [question.root]: noteName(question.root),
    [target]: noteName(target),
  };

  // Solo se ofrecen los intervalos del nivel: con los doce siempre en pantalla
  // los primeros niveles no servirían de nada.
  const options = PIANO_INTERVALS.filter((interval) =>
    level.semitones.includes(interval.semitones),
  );

  const optionClass = (semitones: number) => {
    if (answered === null) {
      return "border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:border-emerald-300/50 hover:bg-white/10";
    }
    if (semitones === question.interval.semitones)
      return "border-emerald-400/60 bg-emerald-400/20 text-emerald-100";
    if (semitones === answered) return "border-rose-400/60 bg-rose-400/20 text-rose-100";
    return "border-white/5 bg-white/[0.02] text-white/25";
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-16 md:px-8 md:pb-7 md:pt-20">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href="/play/piano/reconocer-intervalos"
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
              ¿Qué <span className="text-emerald-300">intervalo</span> es?
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
          {/* pt-9: hueco para los globitos con el nombre de cada tecla. */}
          <div className="pt-9">
            <PianoKeyboard
              from={0}
              octaves={2}
              marks={marks}
              badges={badges}
              disabled
            />
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => play(question)}
              className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-sky-100 transition hover:border-sky-300/60 hover:bg-sky-400/20"
            >
              <Volume2 size={14} strokeWidth={1.8} />
              Escuchar las dos
            </button>
          </div>

          <div className="mx-auto mt-6 grid w-full max-w-[680px] grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
            {options.map((interval) => (
              <button
                key={interval.semitones}
                type="button"
                onClick={() => choose(interval.semitones)}
                disabled={answered !== null}
                title={interval.name}
                className={`min-h-[58px] rounded-2xl border px-2 py-3 text-lg font-black tracking-tight backdrop-blur-sm transition duration-150 disabled:cursor-default ${optionClass(interval.semitones)}`}
              >
                {interval.short}
              </button>
            ))}
          </div>

          <p
            className={`mt-5 text-center text-xs font-black uppercase tracking-[0.2em] transition-opacity ${
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
                ? `¡Bien! ${question.interval.name}`
                : `Era ${question.interval.name}`}
          </p>
        </main>

        <RoundFooter
          step={step}
          total={total}
          liveStep={liveStep}
          results={round.questions.map((item, index) => {
            const given = round.answers[index];
            return given === null ? null : given === item.interval.semitones;
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
