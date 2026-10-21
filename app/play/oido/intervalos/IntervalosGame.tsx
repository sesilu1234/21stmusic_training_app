"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import GameChrome from "@/app/components/GameChrome";
import { ROUND_LENGTH } from "@/lib/roundLength";
import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import {
  INTERVALS,
  BUTTON_LABELS,
  PRESETS,
  PRESET_ICONS,
  useAudio,
} from "../audio";
import GameOverModal from "@/app/components/GameOverModal";
import { useAbandono } from "@/app/components/useAbandono";
import Backdrop from "@/app/components/Backdrop";
import { earButtonGrid, earLevelPath, type EarIntervalLevel } from "@/lib/earIntervals";


export default function IntervalosAuditivos({ level }: { level: EarIntervalLevel }) {

  const totalQuestions = ROUND_LENGTH;
  const [quizList, setQuizList]       = useState<typeof INTERVALS>([]);
  const [step, setStep]               = useState(0);
  const [results, setResults]         = useState<(null|"correct"|"wrong")[]>(Array(totalQuestions).fill(null));
  const [userAnswers, setUserAnswers] = useState<(string|null)[]>(Array(totalQuestions).fill(null));
  const [answerState, setAnswerState] = useState<"idle"|"correct"|"wrong">("idle");
  const [gameOver, setGameOver]       = useState(false);

  // Si se va a media partida, queda apuntada como abandonada. Lo que ve el
  // alumno no cambia: esto no pinta nada.
  const savePath = earLevelPath("/play/oido/intervalos", level);
  useAbandono(results, gameOver, savePath);
  const [isMounted, setIsMounted]     = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [solutionStep, setSolutionStep] = useState<number | null>(null);

  const [presetIdx, setPresetIdx]     = useState(0);
  const [speed, setSpeed]             = useState(0.25);
  const gapMs                         = Math.round(300 + speed * 1700);

  const [noteFlash, setNoteFlash]     = useState<0|1|2>(0);
  const [isPlaying, setIsPlaying]     = useState(false);

  /**
   * La nota de partida de cada pregunta, sorteada una sola vez al preparar la
   * ronda. Antes se sorteaba al sonar y solo se recordaba la de la pregunta de
   * ahora, así que al volver atrás a una ya contestada sonaba el mismo
   * intervalo desde otra nota, y parecía que el ejercicio había cambiado.
   */
  const rootsRef = useRef<number[]>([]);
  const shouldAutoPlayNextRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const { playInterval } = useAudio();

  useEffect(() => {
    const startRound = () => {
      const total = ROUND_LENGTH;
      setResults(Array(total).fill(null));
      setUserAnswers(Array(total).fill(null));
      const list: typeof INTERVALS = [];
      // Solo los del nivel.
      const pool = INTERVALS.filter((iv) => level.intervals.includes(iv.name));
      // Each one at random, repeats allowed: banning the previous one would
      // give away an answer.
      for (let i = 0; i < total; i++) {
        list.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      // El mismo abanico que sorteaba `playInterval` al sonar: de Do a Sol.
      rootsRef.current = list.map(() => Math.floor(Math.random() * 8));
      setQuizList(list);
      setIsMounted(true);
    };
    startRound();
  }, [level]);

  const currentInterval = quizList[step];
  /** Solo los botones de lo que puede sonar en este nivel. */
  const buttonLabels = BUTTON_LABELS.filter((label) => level.intervals.includes(label));
  const correctCount    = results.filter(r => r === "correct").length;
  const progresoMaximo = userAnswers.indexOf(null) === -1 ? totalQuestions : userAnswers.indexOf(null);

  const triggerPlay = useCallback((interval: typeof INTERVALS[0], root = -1, force = false) => {
    if (isPlaying && !force) return;
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    setIsPlaying(true);
    setNoteFlash(1);
    playInterval(interval.semitones, gapMs, presetIdx, root);
    flashTimerRef.current = window.setTimeout(() => setNoteFlash(2), gapMs);
    finishTimerRef.current = window.setTimeout(() => {
      setNoteFlash(0);
      setIsPlaying(false);
      flashTimerRef.current = null;
      finishTimerRef.current = null;
    }, gapMs + 1400);
  }, [isPlaying, gapMs, presetIdx, playInterval]);

  const handleAnswer = (label: string) => {
    if (userAnswers[step] !== null || gameOver) return;
    setIsReviewing(false);
    setSolutionStep(null);
    const isCorrect = label === currentInterval.name;
    const newResults  = [...results];  newResults[step]  = isCorrect ? "correct" : "wrong";
    const newAnswers  = [...userAnswers]; newAnswers[step] = label;
    setResults(newResults); setUserAnswers(newAnswers);
    setAnswerState(isCorrect ? "correct" : "wrong");
    if (step < totalQuestions - 1) {
      setTimeout(() => {
        shouldAutoPlayNextRef.current = true;
        setStep(step + 1);
        setAnswerState("idle");
      }, 950);
    } else {
      setTimeout(() => setGameOver(true), 1050);
    }
  };

  useEffect(() => {
    if (!currentInterval || !isMounted || isReviewing) return;
    if (!shouldAutoPlayNextRef.current) return;
    shouldAutoPlayNextRef.current = false;
    const timer = window.setTimeout(
      () => triggerPlay(currentInterval, rootsRef.current[step], true),
      120,
    );
    return () => window.clearTimeout(timer);
  }, [currentInterval, isMounted, isReviewing, triggerPlay, step]);

  const goBack = () => {
    setAnswerState("idle");
    const previousStep = Math.max(0, step - 1);
    setSolutionStep(userAnswers[previousStep] !== null ? previousStep : null);
    setIsReviewing(userAnswers[previousStep] !== null);
    setStep(previousStep);
  };

  const goNext = () => {
    const nextStep = step + 1;
    if (nextStep <= progresoMaximo && nextStep < totalQuestions) {
      setAnswerState("idle");
      const nextIsAnswered = userAnswers[nextStep] !== null;
      setSolutionStep(nextIsAnswered ? nextStep : null);
      setIsReviewing(nextIsAnswered);
      setStep(nextStep);
    }
  };

  if (!isMounted || !currentInterval) return <div className="min-h-screen bg-slate-900" />;

  const pct = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-x-hidden text-white">
      <Backdrop />

      <div className="relative z-10 min-h-screen flex flex-col">
      <GameChrome>
        ¿Qué{" "}
        <span className="text-black drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)]">INTERVALO</span>
        {" "}escuchas?
      </GameChrome>

      {/* GAME OVER OVERLAY — blur only, no black */}
      {gameOver && (
        <GameOverModal correct={correctCount} total={totalQuestions} savePath={savePath} />
      )}

      {/* CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6 z-10 w-full max-w-5xl mx-auto">


        <div className="relative flex flex-col items-center w-full max-w-sm md:max-w-lg mb-8">
          <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full h-44 md:h-52 flex items-center justify-center border-4 border-white relative overflow-hidden">
            <div className="absolute top-4 right-6 text-black/10 font-black italic text-lg">#{step + 1}</div>
            <div className="flex items-center gap-6 md:gap-10">
              <div className="flex flex-col items-center">
                <span className="text-[8px] md:text-[10px] tracking-[0.25em] text-black/40 font-semibold uppercase mb-2">Nota 1</span>
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-lg md:text-xl font-black italic border-2 border-black transition-all duration-100 ${
                  noteFlash === 1 ? "bg-amber-400 text-black shadow-[4px_4px_0px_#000] scale-110" : "bg-white text-black/20 shadow-[4px_4px_0px_rgba(0,0,0,0.12)] scale-100"
                }`}>♩</div>
              </div>
              <div className="text-black/15 font-black text-2xl italic">→</div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] md:text-[10px] tracking-[0.25em] text-black/40 font-semibold uppercase mb-2">Nota 2</span>
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-lg md:text-xl font-black italic border-2 border-black transition-all duration-100 ${
                  noteFlash === 2 ? "bg-sky-400 text-black shadow-[4px_4px_0px_#000] scale-110" : "bg-white text-black/20 shadow-[4px_4px_0px_rgba(0,0,0,0.12)] scale-100"
                }`}>♩</div>
              </div>
            </div>
          </div>

          <div
            className={`absolute -bottom-7 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
              isReviewing && solutionStep === step
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0 pointer-events-none"
            }`}
          >
            <div className="px-6 py-2 rounded-xl border border-amber-400/50 bg-black/90 backdrop-blur-xl flex flex-col items-center shadow-2xl min-w-[140px]">
              <span className="text-[7px] text-amber-400 uppercase font-black tracking-widest">
                Solución
              </span>
              <span className="text-sm font-bold text-white uppercase">
                {currentInterval.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 mt-6">
          <button
            onClick={() => triggerPlay(currentInterval, rootsRef.current[step])}
            disabled={isPlaying}
            className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all shadow-xl
              ${isPlaying
                ? "border-white/5 bg-white/5 text-white/25 cursor-default"
                : "border-black bg-amber-300/95 text-black shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              }`}
          >
            <Volume2 size={14} />
            Escuchar
          </button>

          <div className="flex items-center bg-black/50 border border-white/10 rounded-md p-2 backdrop-blur-md gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setPresetIdx(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all duration-100 border-2
                  ${presetIdx === i
                    ? "bg-amber-400 text-black border-black shadow-[4px_4px_0px_#000]"
                    : "bg-white/5 text-white/40 border-transparent hover:text-white/80 hover:bg-white/10"
                  }`}
              >
                <span className="text-sm leading-none">{PRESET_ICONS[i]}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-black/50 border border-white/10 rounded-md px-4 py-2 backdrop-blur-md">
            <span className="text-white/40 text-[9px] uppercase tracking-widest">Tiempo</span>
            <input
              type="range" min={0} max={1} step={0.01} value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              className="w-24 md:w-32 accent-amber-400"
              style={{ height: "2px" }}
            />
            <span className="text-amber-400 text-sm font-black leading-none w-8 text-right">{speed.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-black/40 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full backdrop-blur-md">
          <div className={`grid gap-2 md:gap-3 ${earButtonGrid(buttonLabels.length)}`}>
            {buttonLabels.map((btn) => {
              const answered     = userAnswers[step] !== null;
              const currentResult = results[step];
              const isCorrectBtn = answered && btn === currentInterval.name;
              const isWrongBtn   = answered && currentResult === "wrong" && btn === userAnswers[step];
              return (
                <button
                  key={btn}
                  onClick={() => handleAnswer(btn)}
                  disabled={answered}
                  className={`
                    flex items-center justify-center h-12 md:h-14 rounded-xl border transition-all duration-150 active:scale-90
                    ${btn === "Unísono" ? "col-span-2 md:col-span-1" : ""}
                    ${isCorrectBtn
                      ? "border-emerald-400 bg-emerald-500 text-white font-black shadow-[3px_3px_0px_rgba(0,0,0,0.4)]"
                      : isWrongBtn
                        ? "border-red-500 bg-red-500 text-white font-black shadow-[3px_3px_0px_rgba(0,0,0,0.4)]"
                        : answered
                          ? "border-white/5 bg-white/5 text-white/20 font-bold cursor-default"
                          : "border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:border-amber-400 hover:text-black font-bold"
                    }
                  `}
                >
                  <span className="text-[10px] md:text-sm">{btn}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full mt-10 md:mt-14 flex flex-col items-center">
          <div className="flex items-center justify-between w-full max-w-md gap-4">
            <button
              onClick={goBack}
              className={`p-3 bg-white/5 border border-white/10 text-white rounded-full transition-all ${step === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex flex-wrap justify-center gap-1 p-2 bg-black/20 rounded-2xl border border-white/5 max-w-[260px] md:max-w-none">
              {results.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (userAnswers[i] !== null) {
                      setAnswerState("idle");
                      setSolutionStep(i);
                      setIsReviewing(true);
                      setStep(i);
                    }
                  }}
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-md border flex items-center justify-center text-[7px] font-black transition-all ${
                    res === "correct"  ? "bg-green-500 text-white border-green-400 cursor-pointer" :
                    res === "wrong"    ? "bg-red-500 text-white border-red-400 cursor-pointer" :
                    i === step         ? "border-amber-400 bg-white/20 text-white scale-110 shadow-[0_0_10px_rgba(251,191,36,0.4)]" :
                                         "border-white/5 text-white/5"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={goNext}
              className={`p-3 bg-amber-500 text-black rounded-full shadow-lg transition-all ${
                step < progresoMaximo && step < totalQuestions - 1
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <footer className="mt-auto py-8 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase">
          © 2026 21st Century Music
        </footer>
      </div>
      </div>
    </div>
  );
}
