"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2 } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import GameOverModal from "@/app/components/GameOverModal";
import RoundFooter from "@/app/components/RoundFooter";
import PianoKeyboard, { noteName, type KeyMark } from "@/app/components/PianoKeyboard";
import StaffNote from "@/app/components/StaffNote";
import { PRESET_ICONS, PRESETS, useAudio } from "@/app/play/oido/audio";
import {
  buildPianoNoteQuiz,
  type PianoNoteLevel,
  type PianoNoteQuestion,
} from "@/lib/pianoNotes";
import { ROUND_LENGTH } from "@/lib/roundLength";

interface Round {
  questions: PianoNoteQuestion[];
  answers: (number | null)[];
}

const createRound = (level: PianoNoteLevel): Round => {
  const total = ROUND_LENGTH;
  return {
    questions: buildPianoNoteQuiz(level, total),
    answers: Array<number | null>(total).fill(null),
  };
};

export default function PianoNoteGame({ level }: { level: PianoNoteLevel }) {
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
        answer !== null && answer === round.questions[index].semitone ? sum + 1 : sum,
      0,
    ) ?? 0;

  const playNote = useCallback(
    (semitone: number) => {
      playSequence([[semitone]], 400, presetIdx);
    },
    [playSequence, presetIdx],
  );

  const press = (semitone: number) => {
    if (!round || !question || answered !== null || gameOver) return;

    const answers = [...round.answers];
    answers[step] = semitone;
    setRound({ ...round, answers });
    playNote(semitone);

    const isCorrect = semitone === question.semitone;
    advanceTimerRef.current = window.setTimeout(
      () => {
        if (step < total - 1) {
          setStep(step + 1);
        } else {
          setGameOver(true);
        }
      },
      isCorrect ? 850 : 1700,
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

  const isCorrect = answered === question.semitone;

  // El teclado no adelanta nada hasta que se contesta: la pista está en el
  // pentagrama, y marcar la tecla antes sería resolver el ejercicio.
  const marks: Record<number, KeyMark> = {};
  if (answered !== null) {
    marks[question.semitone] = "correct";
    if (!isCorrect) marks[answered] = "wrong";
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      {gameOver && <GameOverModal correct={correctCount} total={total} />}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-4 pb-5 pt-16 md:px-8 md:pb-7 md:pt-20">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:gap-4">
          <Link
            href="/play/piano/notas"
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
              Toca esta <span className="text-emerald-300">nota</span>
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
          <div className="mb-7 flex justify-center">
            <div className="w-full max-w-[330px] rounded-3xl border-4 border-white/15 bg-slate-950/70 px-4 py-3 shadow-2xl backdrop-blur-sm">
              <StaffNote
                semitone={question.semitone}
                clef={level.clef}
                preferFlat={question.preferFlat}
                state={answered === null ? "idle" : isCorrect ? "correct" : "wrong"}
              />
            </div>
          </div>

          <PianoKeyboard
            from={level.keyboardFrom}
            octaves={level.keyboardOctaves}
            marks={marks}
            onPress={press}
            disabled={answered !== null || gameOver}
          />

          <div className="mt-6 flex min-h-[2.5rem] items-center justify-center gap-3">
            {answered === null ? (
              <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/25">
                Pulsa la tecla en el piano
              </p>
            ) : (
              <>
                <p
                  className={`text-center text-xs font-black uppercase tracking-[0.2em] ${
                    isCorrect ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {isCorrect
                    ? `¡Bien! Era ${noteName(question.semitone)}`
                    : `Era ${noteName(question.semitone)}, no ${noteName(answered)}`}
                </p>
                <button
                  type="button"
                  onClick={() => playNote(question.semitone)}
                  aria-label="Oír la nota correcta"
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
            return given === null ? null : given === item.semitone;
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
