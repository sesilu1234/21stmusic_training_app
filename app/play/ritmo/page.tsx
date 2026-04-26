"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import MusicLine from "./MusicDisplay";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface RhythmQuestion {
  id: number;
  bpm: number;
  beats: number[]; // array of beat timestamps in ms (relative to start)
  totalDuration: number; // ms
}

// ─── PLACEHOLDER DATA (reemplazar con tus datos reales) ───────────────────────
const ritmo_data: RhythmQuestion[] = [
  { id: 1, bpm: 60, beats: [0, 1000, 2000, 3000], totalDuration: 4000 },
  { id: 2, bpm: 60, beats: [0, 500, 1000, 2000, 3000], totalDuration: 4000 },
  { id: 3, bpm: 80, beats: [0, 750, 1500, 2250, 3000], totalDuration: 4000 },
];

const TOTAL_QUESTIONS = ritmo_data.length;
const HIT_WINDOW_MS = 150; // ±ms de tolerancia para considerar el golpe como correcto

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function RitmoGame() {
  const router = useRouter();

  const [quizList, setQuizList] = useState<RhythmQuestion[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [gamePhase, setGamePhase] = useState<
    "idle" | "countdown" | "playing" | "result"
  >("idle");
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [userTaps, setUserTaps] = useState<number[]>([]); // timestamps of user taps relative to start
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>(
    Array(TOTAL_QUESTIONS).fill(null),
  );
  const [gameOver, setGameOver] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [lastTapFlash, setLastTapFlash] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const shuffled = [...ritmo_data].sort(() => Math.random() - 0.5);
    setQuizList(shuffled);
    setIsMounted(true);
  }, []);

  const currentQuestion = quizList[step];

  // ── Keyboard listener ─────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (gamePhase !== "playing" || !startTime) return;
    const now = performance.now() - startTime;
    setUserTaps((prev) => [...prev, now]);
    setLastTapFlash(true);
    setTimeout(() => setLastTapFlash(false), 80);
  }, [gamePhase, startTime]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gamePhase === "idle") startRound();
        else handleTap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gamePhase, handleTap]);

  // ── Countdown → Play ──────────────────────────────────────────────────────
  const startRound = () => {
    if (gamePhase !== "idle") return;
    setUserTaps([]);
    setCountdown(3);
    setGamePhase("countdown");

    let count = 3;
    const iv = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(iv);
        const t0 = performance.now();
        setStartTime(t0);
        setGamePhase("playing");

        // Auto-end after totalDuration + buffer
        setTimeout(() => {
          endRound(t0);
        }, currentQuestion.totalDuration + 500);
      }
    }, 1000);
  };

  const endRound = (t0: number) => {
    setGamePhase("result");

    // Score: compare userTaps to beats
    setUserTaps((taps) => {
      const hits = scoreRound(taps, currentQuestion.beats);
      const isCorrect = hits >= currentQuestion.beats.length * 0.75; // 75% threshold

      const newResults = [...results];
      newResults[step] = isCorrect ? "correct" : "wrong";
      setResults(newResults);

      setTimeout(() => {
        if (step < TOTAL_QUESTIONS - 1) {
          setStep((s) => s + 1);
          setGamePhase("idle");
        } else {
          setGameOver(true);
        }
      }, 1200);

      return taps;
    });
  };

  const scoreRound = (taps: number[], beats: number[]): number => {
    let hits = 0;
    const usedBeats = new Set<number>();
    for (const tap of taps) {
      for (let i = 0; i < beats.length; i++) {
        if (!usedBeats.has(i) && Math.abs(tap - beats[i]) <= HIT_WINDOW_MS) {
          hits++;
          usedBeats.add(i);
          break;
        }
      }
    }
    return hits;
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 0) return;
    setIsReviewing(true);
    setGamePhase("idle");
    setStep((s) => s - 1);
  };

  const goNext = () => {
    const next = step + 1;
    if (next < TOTAL_QUESTIONS && results[next] !== null) {
      setStep(next);
      setIsReviewing(true);
      setGamePhase("idle");
    }
  };

  const progresoMaximo =
    results.indexOf(null) === -1 ? TOTAL_QUESTIONS : results.indexOf(null);

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!isMounted || !currentQuestion) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center font-sans"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* ── HEADER ── */}
      <div className="w-full px-4 pt-6 md:px-12 flex justify-between items-start z-20">
        <button
          onClick={() => router.push("/")}
          className="text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/10 transition-all"
        >
          ← <span className="hidden sm:inline">Menú Principal</span>
          <span className="sm:hidden">Menú</span>
        </button>

        <div className="flex gap-4 md:gap-8 opacity-40 md:opacity-90">
          <img
            src="/assets/logo21stCM_no_white_1.png"
            className="h-12 md:h-24 w-auto drop-shadow-2xl"
            alt="logo"
          />
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10 w-full md:max-w-[90%] mx-auto">
        {/* Title */}
        <div className="mb-6 text-center">
          <h2 className="text-white text-xl md:text-3xl font-black italic tracking-tighter leading-tight uppercase">
            Pulsa al{" "}
            <span className="text-black bg-white/90 px-2 rounded-sm drop-shadow-sm">
              RITMO
            </span>
          </h2>
        </div>

        {/* ── PENTAGRAMA CONTAINER ── */}
        <div className="relative w-full md:max-w-[90%] mb-8">
          <div className="bg-white p-0 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl w-full h-44 md:h-56 flex flex-col items-center justify-center border-4 border-white relative overflow-hidden">
            {/* ─────────────────────────────────────────────────────────────
                AQUÍ VA TU PENTAGRAMA / PARTITURA
                currentQuestion.beats → los golpes a representar
                currentQuestion.bpm   → tempo
            ───────────────────────────────────────────────────────────── */}
            <div className="w-full h-full flex flex-col items-start justify-center text-black/20 text-xs select-none">
              <MusicLine />
            </div>
          </div>
        </div>

        {/* ── TAP ZONE ── */}
        <div
          ref={containerRef}
          onPointerDown={() =>
            gamePhase === "idle" ? startRound() : handleTap()
          }
          className={`
            relative w-full max-w-2xl h-28 md:h-36 rounded-[2rem] border-2 flex flex-col items-center justify-center cursor-pointer select-none
            transition-all duration-75 active:scale-[0.98] max-w-[90%]
            ${
              gamePhase === "playing"
                ? lastTapFlash
                  ? "bg-amber-400/30 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]"
                  : "bg-black/40 border-amber-400/60 backdrop-blur-md"
                : gamePhase === "countdown"
                  ? "bg-black/30 border-white/20 backdrop-blur-md"
                  : gamePhase === "result"
                    ? results[step] === "correct"
                      ? "bg-green-500/20 border-green-400"
                      : "bg-red-500/20 border-red-400"
                    : "bg-black/40 border-white/10 backdrop-blur-md hover:border-amber-400/40"
            }
          `}
        >
          {gamePhase === "idle" && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-white/80 font-black text-sm md:text-base uppercase tracking-widest">
                Pulsa para empezar
              </span>
              <span className="text-white/30 text-[10px] uppercase tracking-[0.3em]">
                Espacio · Tap
              </span>
            </div>
          )}

          {gamePhase === "countdown" && (
            <span className="text-amber-400 font-black text-5xl md:text-7xl italic">
              {countdown === 0 ? "¡YA!" : countdown}
            </span>
          )}

          {gamePhase === "playing" && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-white/60 text-[10px] uppercase tracking-[0.3em]">
                {userTaps.length} golpes
              </span>
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center">
                <div
                  className={`w-4 h-4 md:w-6 md:h-6 rounded-full bg-amber-400 transition-all duration-75 ${lastTapFlash ? "scale-150" : "scale-100"}`}
                />
              </div>
            </div>
          )}

          {gamePhase === "result" && (
            <span
              className={`font-black text-2xl md:text-3xl italic uppercase ${results[step] === "correct" ? "text-green-400" : "text-red-400"}`}
            >
              {results[step] === "correct" ? "¡Bien!" : "Sigue practicando"}
            </span>
          )}
        </div>

        {/* ── BPM indicator ── */}
        <div className="mt-3 text-white/20 text-[9px] uppercase tracking-widest">
          {currentQuestion.bpm} bpm · {currentQuestion.beats.length} tiempos
        </div>

        {/* ── PROGRESS + NAVIGATION ── */}
        <div className="w-full mt-10 md:mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center justify-between w-full max-w-md gap-4">
            <button
              onClick={goBack}
              className={`p-3 bg-white/5 border border-white/10 text-white rounded-full transition-all ${step === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex flex-wrap justify-center gap-1 p-2 bg-black/20 rounded-2xl border border-white/5 max-w-[240px] md:max-w-none">
              {results.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    if (results[i] !== null) {
                      setIsReviewing(true);
                      setGamePhase("idle");
                      setStep(i);
                    }
                  }}
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-md border flex items-center justify-center text-[7px] font-black cursor-pointer transition-all ${
                    res === "correct"
                      ? "bg-green-500 text-white border-green-400"
                      : res === "wrong"
                        ? "bg-red-500 text-white border-red-400"
                        : i === step
                          ? "border-amber-400 bg-white/20 text-white scale-110 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                          : "border-white/5 text-white/5"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <button
              onClick={goNext}
              className={`p-3 bg-amber-500 text-black rounded-full shadow-lg transition-all ${isReviewing && step < progresoMaximo ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <footer className="mt-auto py-8 text-center text-slate-600 text-[8px] tracking-[0.6em] uppercase">
          © 2026 21st Century Music
        </footer>
      </div>

      {/* ── FINAL MODAL ── */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="text-center p-8 md:p-12 bg-white/5 rounded-[2.5rem] md:rounded-[4rem] border border-white/10 max-w-sm w-full">
            <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">
              ¡Hecho!
            </h2>
            <div className="text-4xl font-black text-amber-400 my-6 italic">
              {results.filter((r) => r === "correct").length}
              <span className="text-white/20 text-2xl mx-2">/</span>
              {TOTAL_QUESTIONS}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              Reiniciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
