"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";

const TOTAL_QUESTIONS = 24;

const INTERVALS = [
  { name: "Unísono", semitones: 0 },
  { name: "b2",      semitones: 1 },
  { name: "2",       semitones: 2 },
  { name: "b3",      semitones: 3 },
  { name: "3",       semitones: 4 },
  { name: "4",       semitones: 5 },
  { name: "b5",      semitones: 6 },
  { name: "5",       semitones: 7 },
  { name: "b6",      semitones: 8 },
  { name: "6",       semitones: 9 },
  { name: "b7",      semitones: 10 },
  { name: "7",       semitones: 11 },
  { name: "8va",     semitones: 12 },
];

const BUTTON_LABELS = ["Unísono","b2","2","b3","3","4","b5","5","b6","6","b7","7","8va"];
const BASE_FREQ = 261.63;

function semitonesToFreq(s: number) {
  return BASE_FREQ * Math.pow(2, s / 12);
}

type Preset = { label: string; make: (ctx: AudioContext, freq: number, when: number) => void };

const PRESETS: Preset[] = [
  {
    label: "Piano",
    make(ctx, freq, when) {
      const master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.setValueAtTime(0, when);
      master.gain.linearRampToValueAtTime(0.55, when + 0.020);
      master.gain.setTargetAtTime(0.18, when + 0.020, 0.15);
      master.gain.exponentialRampToValueAtTime(0.001, when + 3.5);
      [1,2,3,4,5].forEach((p, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "sine"; osc.frequency.setValueAtTime(freq * p, when);
        g.gain.setValueAtTime([0.5,0.25,0.12,0.06,0.03][i], when);
        osc.connect(g); g.connect(master); osc.start(when); osc.stop(when + 3.6);
      });
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1)*(1-i/d.length);
      const ns = ctx.createBufferSource(); const ng = ctx.createGain();
      ns.buffer = buf;
      ng.gain.setValueAtTime(0, when);
      ng.gain.linearRampToValueAtTime(0.06, when + 0.006);
      ng.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
      ns.connect(ng); ng.connect(master); ns.start(when);
    },
  },
  {
    label: "Flauta",
    make(ctx, freq, when) {
      const master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.setValueAtTime(0, when);
      master.gain.linearRampToValueAtTime(0.4, when + 0.02);
      master.gain.exponentialRampToValueAtTime(0.001, when + 2.0);
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, when);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, when);
      lfoGain.gain.setValueAtTime(0, when);
      lfoGain.gain.linearRampToValueAtTime(3, when + 0.3);
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      osc.connect(master); osc.start(when); osc.stop(when + 2.1);
      lfo.start(when); lfo.stop(when + 2.1);
    },
  },
  {
    label: "Marimba",
    make(ctx, freq, when) {
      const master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.setValueAtTime(0, when);
      master.gain.linearRampToValueAtTime(0.5, when + 0.005);
      master.gain.exponentialRampToValueAtTime(0.001, when + 1.6);
      [[1, 0.6], [3.97, 0.2], [9.87, 0.07], [2, 0.12]].forEach(([ratio, vol]) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * ratio, when);
        g.gain.setValueAtTime(vol, when);
        g.gain.exponentialRampToValueAtTime(0.001, when + 1.6 / ratio);
        osc.connect(g); g.connect(master); osc.start(when); osc.stop(when + 1.7);
      });
    },
  },
  {
    label: "Synth",
    make(ctx, freq, when) {
      const master = ctx.createGain(); master.connect(ctx.destination);
      master.gain.setValueAtTime(0, when); master.gain.linearRampToValueAtTime(0.45, when + 0.02);
      master.gain.setValueAtTime(0.35, when + 0.1); master.gain.exponentialRampToValueAtTime(0.001, when + 2.0);
      [-2,2].forEach(det => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "sawtooth"; osc.frequency.setValueAtTime(freq + det, when);
        osc.frequency.linearRampToValueAtTime(freq + det + 2, when + 0.05);
        g.gain.setValueAtTime(0.22, when); osc.connect(g); g.connect(master); osc.start(when); osc.stop(when + 2.1);
      });
      const sub = ctx.createOscillator(); const sg = ctx.createGain();
      sub.type = "sine"; sub.frequency.setValueAtTime(freq/2, when); sg.gain.setValueAtTime(0.18, when);
      sub.connect(sg); sg.connect(master); sub.start(when); sub.stop(when + 2.1);
    },
  },
];

const PRESET_ICONS = ["🎹", "🪈", "🪘", "🎛️"];

function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  function getCtx(): AudioContext {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctxRef.current;
  }
  const playInterval = useCallback((semitones: number, gapMs: number, presetIdx: number, rootOffset = -1) => {
    const ctx = getCtx();
    const root = rootOffset >= 0 ? rootOffset : Math.floor(Math.random() * 8);
    const gap  = gapMs / 1000;
    const doPlay = () => {
      const now = ctx.currentTime;
      PRESETS[presetIdx].make(ctx, semitonesToFreq(root), now);
      PRESETS[presetIdx].make(ctx, semitonesToFreq(root + semitones), now + gap);
    };
    if (ctx.state === "suspended") ctx.resume().then(doPlay);
    else doPlay();
    return root;
  }, []);
  return { playInterval };
}

export default function IntervalosAuditivos() {
  const router = useRouter();

  const [quizList, setQuizList]       = useState<typeof INTERVALS>([]);
  const [step, setStep]               = useState(0);
  const [results, setResults]         = useState<(null|"correct"|"wrong")[]>(Array(TOTAL_QUESTIONS).fill(null));
  const [userAnswers, setUserAnswers] = useState<(string|null)[]>(Array(TOTAL_QUESTIONS).fill(null));
  const [answerState, setAnswerState] = useState<"idle"|"correct"|"wrong">("idle");
  const [gameOver, setGameOver]       = useState(false);
  const [isMounted, setIsMounted]     = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [solutionStep, setSolutionStep] = useState<number | null>(null);

  const [presetIdx, setPresetIdx]     = useState(0);
  const [speed, setSpeed]             = useState(0.25);
  const gapMs                         = Math.round(300 + speed * 1700);

  const [noteFlash, setNoteFlash]     = useState<0|1|2>(0);
  const [isPlaying, setIsPlaying]     = useState(false);

  const currentRootRef = useRef(-1);
  const shouldAutoPlayNextRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const { playInterval } = useAudio();

  useEffect(() => {
    const list: typeof INTERVALS = [];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const previous = list[i - 1];
      const availableIntervals = previous
        ? INTERVALS.filter((interval) => interval.name !== previous.name)
        : INTERVALS;
      list.push(
        availableIntervals[Math.floor(Math.random() * availableIntervals.length)],
      );
    }
    setQuizList(list);
    setIsMounted(true);
  }, []);

  const currentInterval = quizList[step];
  const correctCount    = results.filter(r => r === "correct").length;
  const progresoMaximo = userAnswers.indexOf(null) === -1 ? TOTAL_QUESTIONS : userAnswers.indexOf(null);

  const triggerPlay = useCallback((interval: typeof INTERVALS[0], root = -1, force = false) => {
    if (isPlaying && !force) return;
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    setIsPlaying(true);
    setNoteFlash(1);
    currentRootRef.current = playInterval(interval.semitones, gapMs, presetIdx, root);
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
    if (step < TOTAL_QUESTIONS - 1) {
      setTimeout(() => {
        shouldAutoPlayNextRef.current = true;
        currentRootRef.current = -1;
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
    const timer = window.setTimeout(() => triggerPlay(currentInterval, -1, true), 120);
    return () => window.clearTimeout(timer);
  }, [currentInterval, isMounted, isReviewing, triggerPlay]);

  const goBack = () => {
    setAnswerState("idle");
    const previousStep = Math.max(0, step - 1);
    setSolutionStep(userAnswers[previousStep] !== null ? previousStep : null);
    setIsReviewing(userAnswers[previousStep] !== null);
    setStep(previousStep);
  };

  const goNext = () => {
    const nextStep = step + 1;
    if (nextStep <= progresoMaximo && nextStep < TOTAL_QUESTIONS) {
      setAnswerState("idle");
      const nextIsAnswered = userAnswers[nextStep] !== null;
      setSolutionStep(nextIsAnswered ? nextStep : null);
      setIsReviewing(nextIsAnswered);
      setStep(nextStep);
    }
  };

  if (!isMounted || !currentInterval) return <div className="min-h-screen bg-slate-900" />;

  const pct = Math.round((correctCount / TOTAL_QUESTIONS) * 100);

  return (
    <div
      className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center font-sans"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* HEADER */}
      <div className="w-full px-4 pt-6 md:px-12 flex justify-between items-start z-20">
        <button
          onClick={() => router.push("/")}
          className="text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/10 transition-all"
        >
          ← <span className="hidden sm:inline">Menú Principal</span>
          <span className="sm:hidden">Menú</span>
        </button>
        <div className="flex gap-4 md:gap-8 opacity-40 md:opacity-90">
          <img src="/assets/logo21stCM_no_white_1.png" className="h-12 md:h-24 w-auto drop-shadow-2xl" alt="logo" />
        </div>
      </div>

      {/* GAME OVER OVERLAY — blur only, no black */}
      {gameOver && (
        <div className="fixed inset-0 z-40 backdrop-blur-md" style={{ backgroundColor: "rgba(15,23,42,0.45)" }}>
          <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-8">

            {/* Score card — same white rounded card as the question card */}
            <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full max-w-sm md:max-w-md border-4 border-white p-8 md:p-12 flex flex-col items-center gap-6">

              {/* Brutalist score display */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] tracking-[0.35em] text-black/40 font-bold uppercase mb-3">Resultado final</span>
                <div className="flex items-end gap-2">
                  <span
                    className="font-black italic leading-none"
                    style={{ fontFamily: "Chaney, sans-serif", fontSize: "clamp(4rem, 18vw, 6rem)" }}
                  >
                    {correctCount}
                  </span>
                  <span className="text-black/20 font-black text-3xl mb-3 italic">/{TOTAL_QUESTIONS}</span>
                </div>
                {/* Percentage bar */}
                <div className="w-full h-3 bg-black/8 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-xs font-black mt-2 tracking-widest uppercase ${pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500"}`}>
                  {pct >= 80 ? "¡Excelente!" : pct >= 50 ? "Bien hecho" : "Sigue practicando"}
                </span>
              </div>

              <div className="w-full h-px bg-black/8" />

              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/40">
                +{correctCount} puntos conseguidos
              </p>

              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-amber-400 text-black font-black rounded-2xl text-xs uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
              >
                Reiniciar
              </button>
            </div>

            {/* Mini breakdown — wrong/correct pills */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white text-xs font-bold">{correctCount} correctas</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-white text-xs font-bold">{TOTAL_QUESTIONS - correctCount} errores</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10 w-full max-w-5xl mx-auto">

        <div className="mb-6 text-center">
          <h2 className="text-white text-xl md:text-3xl font-black italic tracking-tighter leading-tight uppercase" style={{ fontFamily: "Chaney, sans-serif" }}>
            ¿Qué{" "}
            <span className="text-black drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)]">INTERVALO</span>
            {" "}escuchas?
          </h2>
        </div>

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
            onClick={() => triggerPlay(currentInterval, currentRootRef.current)}
            disabled={isPlaying}
            className={`flex items-center gap-3 rounded-full border-2 px-7 py-3 text-xs font-black uppercase tracking-[0.22em] transition-all shadow-xl
              ${isPlaying
                ? "border-white/5 bg-white/5 text-white/25 cursor-default"
                : "border-black bg-amber-400 text-black shadow-[5px_5px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#000] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
              }`}
          >
            <Volume2 size={18} />
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
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2 md:gap-3">
            {BUTTON_LABELS.map((btn) => {
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
                step < progresoMaximo && step < TOTAL_QUESTIONS - 1
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
  );
}
