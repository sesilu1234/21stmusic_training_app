"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import {
  INTERVALS,
  BUTTON_LABELS,
  PRESETS,
  PRESET_ICONS,
  useAudio,
} from "../audio";

const TOTAL_QUESTIONS = 16;

type Question = { r1: number; s1: number; r2: number; s2: number; dist: number };

const nameOf = (semitones: number) =>
  INTERVALS.find((iv) => iv.semitones === semitones)?.name ?? "?";

const SLOT_LABELS = ["Intervalo díada 1", "Intervalo díada 2", "Distancia raíz→raíz"];

function makeQuestion(): Question {
  const harmonic = INTERVALS.filter((iv) => iv.semitones > 0); // sin unísono (indistinguible a la vez)
  const s1 = harmonic[Math.floor(Math.random() * harmonic.length)].semitones;
  const s2 = harmonic[Math.floor(Math.random() * harmonic.length)].semitones;
  const dist = Math.floor(Math.random() * 8); // 0..7 semitonos entre fundamentales
  const r1 = Math.floor(Math.random() * 6);   // 0..5
  const r2 = r1 + dist;
  return { r1, s1, r2, s2, dist };
}

export default function DobleArmonico() {
  const router = useRouter();

  const [quizList, setQuizList]       = useState<Question[]>([]);
  const [step, setStep]               = useState(0);
  const [subStep, setSubStep]         = useState(0); // 0,1,2 dentro de la pregunta
  const [answers, setAnswers]         = useState<(string|null)[][]>(
    Array.from({ length: TOTAL_QUESTIONS }, () => [null, null, null]),
  );
  const [results, setResults]         = useState<(null|"correct"|"wrong")[]>(Array(TOTAL_QUESTIONS).fill(null));
  const [gameOver, setGameOver]       = useState(false);
  const [isMounted, setIsMounted]     = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const [presetIdx, setPresetIdx]     = useState(0);
  const [speed, setSpeed]             = useState(0.35);
  const gapMs                         = Math.round(500 + speed * 1500);

  const [chordFlash, setChordFlash]   = useState<0|1|2>(0);
  const [isPlaying, setIsPlaying]     = useState(false);

  const shouldAutoPlayNextRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const { playDouble } = useAudio();

  useEffect(() => {
    setQuizList(Array.from({ length: TOTAL_QUESTIONS }, makeQuestion));
    setIsMounted(true);
  }, []);

  const current = quizList[step];
  const correctCount = results.filter(r => r === "correct").length;
  const answeredCount = results.filter(r => r !== null).length;
  const progresoMaximo = results.indexOf(null) === -1 ? TOTAL_QUESTIONS : results.indexOf(null);
  const questionComplete = results[step] !== null;

  const correctAnswers = current ? [nameOf(current.s1), nameOf(current.s2), nameOf(current.dist)] : [];

  const triggerPlay = useCallback((q: Question, force = false) => {
    if (isPlaying && !force) return;
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    setIsPlaying(true);
    setChordFlash(1);
    playDouble({ root: q.r1, semi: q.s1 }, { root: q.r2, semi: q.s2 }, gapMs, presetIdx);
    flashTimerRef.current = window.setTimeout(() => setChordFlash(2), gapMs);
    finishTimerRef.current = window.setTimeout(() => {
      setChordFlash(0);
      setIsPlaying(false);
      flashTimerRef.current = null;
      finishTimerRef.current = null;
    }, gapMs + 1600);
  }, [isPlaying, gapMs, presetIdx, playDouble]);

  const handleAnswer = (label: string) => {
    if (questionComplete || gameOver) return;
    const newAnswers = answers.map((a) => [...a]);
    newAnswers[step][subStep] = label;
    setAnswers(newAnswers);

    if (subStep < 2) {
      setSubStep(subStep + 1);
      return;
    }

    // Tercera respuesta: evaluar la pregunta completa
    const picks = newAnswers[step];
    const allCorrect = picks.every((p, i) => p === correctAnswers[i]);
    const newResults = [...results];
    newResults[step] = allCorrect ? "correct" : "wrong";
    setResults(newResults);

    if (step < TOTAL_QUESTIONS - 1) {
      setTimeout(() => {
        shouldAutoPlayNextRef.current = true;
        setStep(step + 1);
        setSubStep(0);
      }, 1100);
    } else {
      setTimeout(() => setGameOver(true), 1200);
    }
  };

  useEffect(() => {
    if (!current || !isMounted || isReviewing) return;
    if (!shouldAutoPlayNextRef.current) return;
    shouldAutoPlayNextRef.current = false;
    const timer = window.setTimeout(() => triggerPlay(current, true), 120);
    return () => window.clearTimeout(timer);
  }, [current, isMounted, isReviewing, triggerPlay]);

  const goBack = () => {
    const previousStep = Math.max(0, step - 1);
    setIsReviewing(results[previousStep] !== null);
    setSubStep(0);
    setStep(previousStep);
  };

  const goNext = () => {
    const nextStep = step + 1;
    if (nextStep <= progresoMaximo && nextStep < TOTAL_QUESTIONS) {
      const firstEmpty = answers[nextStep].findIndex((a) => a === null);
      setIsReviewing(results[nextStep] !== null);
      setSubStep(firstEmpty === -1 ? 0 : firstEmpty);
      setStep(nextStep);
    }
  };

  if (!isMounted || !current) return <div className="min-h-screen bg-slate-900" />;

  const pct = Math.round((correctCount / TOTAL_QUESTIONS) * 100);
  const picks = answers[step];

  return (
    <div
      className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center font-sans"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* HEADER */}
      <div className="w-full px-4 pt-6 md:px-12 flex justify-between items-start z-20">
        <button
          onClick={() => router.push("/play/oido")}
          className="text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/10 transition-all"
        >
          ← <span>Oído</span>
        </button>
        <div className="flex gap-4 md:gap-8 opacity-40 md:opacity-90">
          <img src="/assets/logo21stCM_no_white_1.png" className="h-12 md:h-24 w-auto drop-shadow-2xl" alt="logo" />
        </div>
      </div>

      {/* GAME OVER OVERLAY */}
      {gameOver && (
        <div className="fixed inset-0 z-40 backdrop-blur-md" style={{ backgroundColor: "rgba(15,23,42,0.45)" }}>
          <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8">
            <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full max-w-sm md:max-w-md border-4 border-white p-8 md:p-12 flex flex-col items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[9px] tracking-[0.35em] text-black/40 font-bold uppercase mb-3">Resultado final</span>
                <div className="flex items-end gap-2">
                  <span className="font-black italic leading-none" style={{ fontFamily: "Chaney, sans-serif", fontSize: "clamp(4rem, 18vw, 6rem)" }}>
                    {correctCount}
                  </span>
                  <span className="text-black/20 font-black text-3xl mb-3 italic">/{TOTAL_QUESTIONS}</span>
                </div>
                <div className="w-full h-3 bg-black/8 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-xs font-black mt-2 tracking-widest uppercase ${pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500"}`}>
                  {pct >= 80 ? "¡Excelente!" : pct >= 50 ? "Bien hecho" : "Sigue practicando"}
                </span>
              </div>
              <div className="w-full h-px bg-black/8" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">Debes acertar las 3 respuestas para puntuar</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-amber-400 text-black font-black rounded-2xl text-xs uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10 w-full max-w-5xl mx-auto">

        <div className="mb-4 text-center">
          <h2 className="text-white text-lg md:text-2xl font-black italic tracking-tighter leading-tight uppercase" style={{ fontFamily: "Chaney, sans-serif" }}>
            Suenan{" "}
            <span className="text-black drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)]">DOS DÍADAS</span>
          </h2>
          <p className="text-white/50 text-[10px] md:text-xs mt-1 uppercase tracking-widest">
            Di el intervalo de cada una y la distancia entre sus fundamentales
          </p>
        </div>

        {/* Díada visual */}
        <div className="relative flex flex-col items-center w-full max-w-sm md:max-w-lg mb-6">
          <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full h-36 md:h-44 flex items-center justify-center border-4 border-white relative overflow-hidden">
            <div className="absolute top-4 right-6 text-black/10 font-black italic text-lg">#{step + 1}</div>
            <div className="flex items-center gap-8 md:gap-14">
              {[1, 2].map((d) => (
                <div key={d} className="flex flex-col items-center">
                  <span className="text-[8px] md:text-[10px] tracking-[0.25em] text-black/40 font-semibold uppercase mb-2">Díada {d}</span>
                  <div className="flex items-center gap-1.5">
                    {[0, 1].map((n) => (
                      <div
                        key={n}
                        className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-base md:text-lg font-black italic border-2 border-black transition-all duration-100 ${
                          chordFlash === d
                            ? `${n === 0 ? "bg-amber-400" : "bg-sky-400"} text-black shadow-[3px_3px_0px_#000] scale-110`
                            : "bg-white text-black/20 shadow-[3px_3px_0px_rgba(0,0,0,0.12)] scale-100"
                        }`}
                      >
                        ♩
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slots de respuesta */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 w-full max-w-2xl mb-5">
          {SLOT_LABELS.map((label, i) => {
            const pick = picks[i];
            const isActive = !questionComplete && subStep === i;
            const slotCorrect = questionComplete && pick === correctAnswers[i];
            const slotWrong = questionComplete && pick !== correctAnswers[i];
            return (
              <div
                key={i}
                className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-1 transition-all ${
                  slotCorrect ? "border-emerald-400 bg-emerald-500/15" :
                  slotWrong   ? "border-red-500 bg-red-500/15" :
                  isActive    ? "border-amber-400 bg-amber-400/10 shadow-[0_0_16px_rgba(251,191,36,0.25)]" :
                                "border-white/10 bg-white/5"
                }`}
              >
                <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest text-center leading-tight ${isActive ? "text-amber-300" : "text-white/40"}`}>
                  {label}
                </span>
                <span className={`text-base md:text-lg font-black italic ${
                  slotWrong ? "text-red-300 line-through" : pick ? "text-white" : "text-white/20"
                }`}>
                  {pick ?? "—"}
                </span>
                {slotWrong && (
                  <span className="text-[9px] font-bold text-emerald-300 uppercase">{correctAnswers[i]}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Controles */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
          <button
            onClick={() => triggerPlay(current)}
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

        {/* Botonera de intervalos */}
        <div className="bg-black/40 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 w-full backdrop-blur-md">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2 md:gap-3">
            {BUTTON_LABELS.map((btn) => (
              <button
                key={btn}
                onClick={() => handleAnswer(btn)}
                disabled={questionComplete}
                className={`
                  flex items-center justify-center h-12 md:h-14 rounded-xl border transition-all duration-150 active:scale-90
                  ${btn === "Unísono" ? "col-span-2 md:col-span-1" : ""}
                  ${questionComplete
                    ? "border-white/5 bg-white/5 text-white/20 font-bold cursor-default"
                    : "border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:border-amber-400 hover:text-black font-bold"
                  }
                `}
              >
                <span className="text-[10px] md:text-sm">{btn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navegación / progreso */}
        <div className="w-full mt-8 md:mt-12 flex flex-col items-center">
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
                    if (res !== null) {
                      setIsReviewing(true);
                      setSubStep(0);
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
                step < progresoMaximo && step < TOTAL_QUESTIONS - 1 ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <footer className="mt-auto py-8 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase">
          © 2026 21st Century Music · {answeredCount}/{TOTAL_QUESTIONS}
        </footer>
      </div>
    </div>
  );
}
