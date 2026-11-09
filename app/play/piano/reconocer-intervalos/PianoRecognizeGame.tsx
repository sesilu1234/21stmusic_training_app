"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2 } from "lucide-react";
import ThemeLogoPill from "@/app/components/ThemeLogoPill";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import RoundFooter from "@/app/components/RoundFooter";
import PianoKeyboard, { type KeyMark } from "@/app/components/PianoKeyboard";
import { PIANO_GAME_SOUNDS, useAudio, usePianoGameSound } from "@/app/play/oido/audio";
import SoundIconPicker from "@/app/play/oido/SoundIconPicker";
import {
  PIANO_INTERVALS,
  PIANO_PRACTICE_NOTE,
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

export default function PianoRecognizeGame({
  level,
  practice = false,
}: {
  level: PianoIntervalLevel;
  /** true = intervalos elegidos a mano: no se guarda ni cuenta para la medalla. */
  practice?: boolean;
}) {
  const { playSequence } = useAudio();

  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  /** true mientras estás mirando una pregunta vieja en vez de jugando. */
  const [reviewing, setReviewing] = useState(false);
  const { presetIdx, setPresetIdx, variantIdx, setVariantIdx } = usePianoGameSound();

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
    return <div className="min-h-dvh bg-slate-950" />;
  }

  const target = question.root + question.interval.semitones;
  const isCorrect = answered === question.interval.semitones;

  // Las dos teclas del intervalo, encendidas desde el principio: aquí lo que
  // se pregunta es la distancia, no dónde están.
  const marks: Record<number, KeyMark> = {
    [question.root]: "hint",
    [target]: "hint",
  };
  // Aquí no se dice cómo se llaman las dos teclas, ni en un globito ni escrito
  // encima. La pregunta es la distancia entre ellas: con los nombres puestos se
  // acaba respondiendo de memoria ("de Do a Sol es quinta") en vez de mirando
  // el hueco, que es justo lo que hay que aprender a ver. Sin nombres se lee
  // por forma y por distancia, que es como se lee un teclado de verdad.

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
    <div className="relative min-h-dvh overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && (
        <GameOverModal
          correct={correctCount}
          total={total}
          practice={practice ? PIANO_PRACTICE_NOTE : undefined}
        />
      )}

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1100px] flex-col px-4 pb-5 pt-4 md:px-8 md:pb-7 md:pt-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:gap-4">
          <Link
            href="/play/piano/reconocer-intervalos"
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/50 px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60 backdrop-blur-sm transition hover:border-emerald-300/50 hover:text-white md:px-4"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Volver</span>
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

          {/* En el móvil el instrumento baja a su propia línea, debajo del
              título: a su lado le dejaba al título muy poco sitio. */}
          <div className="col-start-2 row-start-2 justify-self-center sm:col-start-3 sm:row-start-1">
            <SoundIconPicker
              options={PIANO_GAME_SOUNDS}
              selectedIdx={presetIdx}
              onSelect={setPresetIdx}
              variantIdx={variantIdx}
              onVariant={setVariantIdx}
              activeClass="bg-emerald-400/25"
            />
          </div>
          <div className="col-start-3 row-start-1 sm:col-start-4">
            <ThemeLogoPill />
          </div>
        </div>

        <main className="mt-auto mx-auto flex w-full max-w-[980px] flex-col pb-2 pt-3 md:pb-5 md:pt-8">
          <PianoKeyboard
            from={0}
            octaves={2}
            marks={marks}
            markLabels={false}
            disabled
          />

          <div className="mt-3 flex justify-center md:mt-5">
            <button
              type="button"
              onClick={() => play(question)}
              className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-sky-100 transition hover:border-sky-300/60 hover:bg-sky-400/20"
            >
              <Volume2 size={14} strokeWidth={1.8} />
              Escuchar las dos
            </button>
          </div>

          {/* En el móvil, cuatro por fila y más bajos: tres filas en vez de cuatro,
              para que la pantalla entre sin scroll. */}
          <div className="mx-auto mt-4 grid w-full max-w-[680px] grid-cols-4 gap-1.5 sm:gap-2.5 md:mt-6 md:grid-cols-6">
            {options.map((interval) => (
              <button
                key={interval.semitones}
                type="button"
                onClick={() => choose(interval.semitones)}
                disabled={answered !== null}
                title={interval.name}
                className={`min-h-[44px] rounded-xl border px-1 py-2 text-base font-black sm:min-h-[58px] sm:rounded-2xl sm:px-2 sm:py-3 sm:text-lg tracking-tight backdrop-blur-sm transition duration-150 disabled:cursor-default ${optionClass(interval.semitones)}`}
              >
                {interval.short}
              </button>
            ))}
          </div>

          <p
            className={`mt-3 text-center text-xs font-black uppercase tracking-[0.2em] transition-opacity md:mt-5 ${
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
