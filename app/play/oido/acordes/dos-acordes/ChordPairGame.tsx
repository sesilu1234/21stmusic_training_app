"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Volume2 } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import RoundFooter from "@/app/components/RoundFooter";
import { noteName } from "@/app/components/PianoKeyboard";
import { PRESET_ICONS, PRESETS, useAudio } from "../../audio";
import {
  buildPairQuiz,
  findDistance,
  findQuality,
  pairChords,
  PAIR_DISTANCES,
  PAIR_QUALITIES,
  type PairLevel,
  type PairQuestion,
} from "@/lib/chordPair";
import { ROUND_LENGTH } from "@/lib/roundLength";

/** Hueco entre el primer acorde y el segundo. */
const GAP_MS = 1150;
const TAIL_MS = 950;

/** Lo que se lleva contestado de una pregunta. */
interface Answer {
  distanceId: string;
  qualityId: string;
}

interface Round {
  questions: PairQuestion[];
  answers: (Answer | null)[];
}

const createRound = (level: PairLevel): Round => ({
  questions: buildPairQuiz(ROUND_LENGTH, level.firstVariable),
  answers: Array<Answer | null>(ROUND_LENGTH).fill(null),
});

const isRight = (given: Answer, question: PairQuestion) =>
  given.distanceId === question.distanceId &&
  given.qualityId === question.qualityId;

/** "Sib menor": cómo se llama el segundo acorde, para cantar la solución. */
const secondName = (question: PairQuestion) => {
  const root = question.root + findDistance(question.distanceId).semitones;
  return `${noteName(root)} ${findQuality(question.qualityId).label.toLowerCase()}`;
};

/**
 * Cuánto más suena la fundamental de cada acorde que el resto de sus notas.
 *
 * 2.2 son unos +7 dB. El primer intento se quedó en 1.4 y no se distinguía: una
 * nota grave compite con tres agudas encima, y el oído se va a las de arriba.
 * Aquí la fundamental no es una nota más, es contra la que se mide todo, así
 * que tiene que destacar de verdad y no solo "estar".
 */
const BASS_BOOST = 2.2;

export default function ChordPairGame({
  level,
  backHref,
}: {
  level: PairLevel;
  backHref: string;
}) {
  const { playSequence } = useAudio();

  const [round, setRound] = useState<Round | null>(null);
  const [step, setStep] = useState(0);
  /** La distancia elegida mientras falta decir el tipo. */
  const [draftDistance, setDraftDistance] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  /** true mientras estás mirando una pregunta vieja en vez de jugando. */
  const [reviewing, setReviewing] = useState(false);
  const [presetIdx, setPresetIdx] = useState(0);
  /** 0 = nada encendido, 1 = primer acorde, 2 = segundo. */
  const [playFlash, setPlayFlash] = useState(0);

  const advanceTimerRef = useRef<number | null>(null);
  const flashTimersRef = useRef<number[]>([]);
  const autoPlayRef = useRef(true);

  // Igual que en los demás modos: la ronda se sortea con Math.random(), así
  // que armarla en el render del servidor daría otra distinta al hidratar.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(createRound(level));
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
        answer && isRight(answer, round.questions[index]) ? sum + 1 : sum,
      0,
    ) ?? 0;

  const play = useCallback(
    (target?: PairQuestion) => {
      if (!target) return;
      clearFlashTimers();

      setPlayFlash(1);
      flashTimersRef.current.push(
        window.setTimeout(() => setPlayFlash(2), GAP_MS),
      );
      flashTimersRef.current.push(
        window.setTimeout(() => setPlayFlash(0), GAP_MS + TAIL_MS),
      );

      // El bajo, un poco por encima del resto. Aquí hay que sacar de oído dos
      // cosas a la vez —la distancia entre los dos acordes y de qué tipo es el
      // segundo— y la distancia se mide entre las fundamentales. Con las cuatro
      // notas al mismo volumen la de abajo se pierde entre las de arriba y no
      // queda de dónde agarrarse. No es subir el volumen: es que se distinga
      // cuál es la nota de referencia.
      playSequence(pairChords(target), GAP_MS, presetIdx, BASS_BOOST);
    },
    [playSequence, presetIdx],
  );

  useEffect(() => {
    if (!question || gameOver || !autoPlayRef.current) return;
    autoPlayRef.current = false;
    const timer = window.setTimeout(() => play(question), 150);
    return () => window.clearTimeout(timer);
  }, [question, gameOver, play]);

  /** En qué pregunta va la partida. -1 = ya están todas contestadas. */
  const liveStep = round?.answers.findIndex((answer) => answer === null) ?? 0;

  /**
   * Ir a una pregunta ya contestada para volver a oírla y ver qué pusiste.
   * No se puede saltar hacia delante: como mucho, a la que está en juego.
   */
  const goTo = (index: number) => {
    const last = liveStep === -1 ? total - 1 : liveStep;
    if (index < 0 || index > last || index === step) return;

    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    clearFlashTimers();
    setPlayFlash(0);
    // Volver a la que está en juego no es revisar: es seguir, y por eso
    // vuelve a sonar sola igual que al llegar a una pregunta nueva.
    const back = index !== last;
    setReviewing(back);
    autoPlayRef.current = !back && liveStep !== -1;
    setStep(index);
    setDraftDistance(null);

    // Ya no quedaba ninguna sin contestar: volver a la última es terminar.
    if (liveStep === -1 && index === total - 1) setGameOver(true);
  };

  /** Cierra la pregunta: se corrige y se pasa a la siguiente. */
  const close = (answer: Answer) => {
    if (!round) return;

    const answers = [...round.answers];
    answers[step] = answer;
    setRound({ ...round, answers });

    advanceTimerRef.current = window.setTimeout(() => {
      if (step < total - 1) {
        autoPlayRef.current = true;
        setStep(step + 1);
        setDraftDistance(null);
      } else {
        setGameOver(true);
      }
    }, 1900);
  };

  const chooseDistance = (id: string) => {
    if (answered || gameOver) return;
    setDraftDistance(id);
  };

  const chooseQuality = (id: string) => {
    if (answered || gameOver || !draftDistance) return;
    close({ distanceId: draftDistance, qualityId: id });
  };

  if (!round || !question) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  const correct = answered ? isRight(answered, question) : null;
  /** Mientras no esté cerrada, se contesta primero la distancia. */
  const asking: "distancia" | "tipo" = draftDistance ? "tipo" : "distancia";

  const shownDistance = answered ? question.distanceId : draftDistance;
  const shownQuality = answered ? question.qualityId : null;

  const slotClass = (filled: boolean, ok: boolean | null, isAsking: boolean) => {
    if (ok !== null) {
      // Ámbar y no rojo cuando fallas: lo que se está enseñando es la
      // solución, y en rojo parecería que la respuesta mala es esa.
      return ok
        ? "border-emerald-500 bg-emerald-300 text-black shadow-[4px_4px_0px_rgba(0,0,0,0.25)]"
        : "border-amber-500 bg-amber-300 text-black shadow-[4px_4px_0px_rgba(0,0,0,0.25)]";
    }
    if (filled) {
      return "border-black bg-violet-300 text-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)]";
    }
    return isAsking
      ? "border-black bg-white text-black/20 shadow-[4px_4px_0px_rgba(0,0,0,0.12)]"
      : "border-black/40 bg-white text-black/20 shadow-[4px_4px_0px_rgba(0,0,0,0.12)]";
  };

  const optionClass = answered
    ? "border-white/5 bg-white/[0.02] text-white/25"
    : "border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-white/10";

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[960px] flex-col px-4 pb-5 pt-4 md:px-8 md:pb-7 md:pt-5">
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
              ¿Qué <span className="text-violet-300">DISTANCIA</span> hay?
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

        <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-start pb-10 pt-6 md:pb-12 md:pt-8">
          <p className="mb-3 text-center text-xs text-white/35">
            El primero te lo damos. Di cuánto sube el segundo y de qué tipo es.
          </p>

          <div className="mb-7 flex flex-col items-center gap-4">
            <div className="relative flex min-h-[190px] w-full max-w-[620px] items-center justify-center overflow-hidden rounded-[2.25rem] border-4 border-white bg-white px-5 py-6 shadow-2xl md:min-h-[230px] md:rounded-[3rem]">
              <div className="absolute right-7 top-5 text-2xl font-black italic text-black/10">
                #{step + 1}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                <div className="flex flex-col items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-black/30">
                    1º acorde
                  </span>
                  <div
                    className={`grid h-16 w-[5.5rem] place-items-center rounded-3xl border-2 leading-tight transition md:h-20 md:w-24 ${
                      playFlash === 1
                        ? "scale-105 border-black bg-amber-300 text-black shadow-[5px_5px_0px_#000]"
                        : "border-black/40 bg-stone-300 text-black/50 shadow-[5px_5px_0px_rgba(0,0,0,0.12)]"
                    }`}
                  >
                    <span className="text-xl font-black italic md:text-2xl">
                      {noteName(question.root)}
                    </span>
                    {/* Ya no es siempre "mayor": en el nivel 7 el primero
                        también puede ser menor, y se dice cuál es. */}
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em]">
                      {findQuality(question.firstQualityId).label.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-black/30">
                    Distancia
                  </span>
                  <div
                    className={`flex h-14 w-16 items-center justify-center rounded-xl border-2 text-lg font-black italic transition md:h-[64px] md:w-[72px] md:text-xl ${slotClass(
                      Boolean(shownDistance),
                      answered
                        ? answered.distanceId === question.distanceId
                        : null,
                      asking === "distancia",
                    )}`}
                  >
                    {shownDistance ? findDistance(shownDistance).label : "?"}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-black/30">
                    2º acorde
                  </span>
                  <div
                    className={`flex h-16 w-[5.5rem] items-center justify-center rounded-3xl border-2 px-1 text-center font-black italic leading-tight transition md:h-20 md:w-24 ${
                      answered ? "text-sm md:text-base" : "text-base md:text-lg"
                    } ${
                      playFlash === 2
                        ? "scale-105 border-black bg-sky-400 text-black shadow-[5px_5px_0px_#000]"
                        : slotClass(
                            Boolean(shownQuality),
                            answered
                              ? answered.qualityId === question.qualityId
                              : null,
                            asking === "tipo",
                          )
                    }`}
                  >
                    {answered
                      ? secondName(question)
                      : shownQuality
                        ? findQuality(shownQuality).label
                        : "?"}
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
                onClick={() => setDraftDistance(null)}
                disabled={Boolean(answered) || !draftDistance}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-white/35 transition hover:text-white/70 disabled:cursor-default disabled:opacity-25 disabled:hover:text-white/35"
              >
                <RotateCcw size={12} />
                Borrar
              </button>
            </div>
          </div>

          {asking === "distancia" ? (
            <div className="mx-auto grid w-full max-w-[620px] grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
              {PAIR_DISTANCES.map((distance) => (
                <button
                  key={distance.id}
                  type="button"
                  onClick={() => chooseDistance(distance.id)}
                  disabled={Boolean(answered)}
                  className={`min-h-[56px] rounded-2xl border px-2 py-3 text-lg font-black tracking-tight backdrop-blur-sm transition duration-150 disabled:cursor-default ${optionClass}`}
                >
                  {distance.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="mx-auto grid w-full max-w-[620px] grid-cols-2 gap-3">
              {PAIR_QUALITIES.map((quality) => (
                <button
                  key={quality.id}
                  type="button"
                  onClick={() => chooseQuality(quality.id)}
                  disabled={Boolean(answered)}
                  className={`min-h-[64px] rounded-2xl border px-3 py-4 text-lg font-black tracking-tight backdrop-blur-sm transition duration-150 disabled:cursor-default md:text-xl ${optionClass}`}
                >
                  {quality.label}
                </button>
              ))}
            </div>
          )}

          <p
            className={`mt-5 text-center text-xs font-black uppercase tracking-[0.2em] transition-opacity ${
              correct === true
                ? "text-emerald-300 opacity-100"
                : correct === false
                  ? "text-rose-300 opacity-100"
                  : "opacity-0"
            }`}
          >
            {correct === true ? (
              "¡Bien!"
            ) : (
              <>
                Dijiste{" "}
                {/* normal-case: en mayúsculas un "b3" se leería "B3", que es
                    otra nota. */}
                <span className="normal-case">
                  {answered ? findDistance(answered.distanceId).label : ""}
                </span>{" "}
                · {answered ? findQuality(answered.qualityId).label : ""}
              </>
            )}
          </p>
        </main>

        <RoundFooter
          step={step}
          total={total}
          liveStep={liveStep}
          results={round.questions.map((item, index) => {
            const given = round.answers[index];
            return given === null ? null : isRight(given, item);
          })}
          correctCount={correctCount}
          reviewing={reviewing}
          onGoTo={goTo}
        />
      </div>
    </div>
  );
}
