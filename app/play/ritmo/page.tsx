"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCtx } from "./metronome";
import SimpleMovingScore from "./MusicDisplay";

export default function RitmoGame() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showScore, setShowScore] = useState(false);

  const [scoreData, setScoreData] = useState({
    hits: 0,
    misses: 0,
    percentage: 0,
  });

  const [bpm, setBpm] = useState(120);
  const [measures] = useState(24);
  const [currentTick, setCurrentTick] = useState(1);
  const [localBpm, setLocalBpm] = useState(120);

  const tapsRef = useRef<{ id: number; time: number }[]>([]);
  const musicRef = useRef<{
    handleStart: (isPlaying: boolean) => void;
    handleBPMChange: (bpm: number) => void;
  }>(null);

  const bpmRef = useRef<number>(120);

  const onGameEnd = useCallback((endType: any, data: any = {}) => {
    setIsPlaying(false);

    if (endType == "reset") return;

    console.log(data);

    setScoreData({
      hits: data.correct_measures,
      misses: data.failed_measures,
      percentage: Math.round(
        ((data.correct_notes / (data.correct_notes + data.failed_notes)) *
          100) /
          Math.max(
            1,
            tapsRef.current.length / (data.correct_notes + data.failed_notes),
          ),
      ),
    });

    setShowScore(true);
  }, []);

  const handleTap = useCallback(() => {
    const ctx = getCtx();
    if (showScore) return;

    if (!isPlaying) {
      setIsPlaying(true);
      tapsRef.current = [];
      musicRef.current?.handleStart(isPlaying);
      return;
    }
    musicRef.current?.handleStart(isPlaying);
    const tapTime = ctx.currentTime;
    tapsRef.current.push({ id: tapsRef.current.length + 1, time: tapTime });
    playTapSound(tapTime);
    setFlash(true);
    setTimeout(() => setFlash(false), 100);
  }, [isPlaying, showScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTap]);

  const playTapSound = (time: number) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(1.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.03);
  };

  useEffect(() => {
    bpmRef.current = bpm;
    musicRef.current?.handleBPMChange(bpm);
  }, [bpm]);

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-900 bg-cover bg-center text-white font-sans relative"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* Pop-up de Marcador */}
      {showScore && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative bg-zinc-950 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-[280px] w-full border-t-white/20">
            <button
              onClick={() => setShowScore(false)}
              className="absolute top-6 right-8 text-zinc-600 hover:text-white transition-colors text-xl font-light"
            >
              ✕
            </button>

            <div className="flex flex-col items-center mb-8">
              <span className="text-[9px] tracking-[0.4em] text-zinc-500 uppercase font-bold mb-3">
                Performance
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black italic tracking-tighter text-white">
                  {scoreData.percentage}
                </span>
                <span className="text-xl font-bold text-amber-500/80">%</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
                  Measures OK
                </span>
                <span className="text-xl font-black text-emerald-500 italic">
                  {scoreData.hits}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
                  Wrong ones
                </span>
                <span className="text-xl font-black text-rose-500 italic">
                  {scoreData.misses}
                </span>
              </div>
            </div>
            <p className="mt-8 text-[8px] tracking-[0.2em] text-zinc-600 uppercase font-bold">
              Tap 'X' to restart
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pt-4 px-4 md:pt-6 md:px-6 flex justify-between items-center z-10">
        <button
          onClick={() => router.push("/")}
          className="bg-black/40 px-3 p-1.5 md:px-4 md:p-2 rounded-full border border-white/10 text-[9px] md:text-[10px] font-bold hover:bg-white/20 transition-colors"
        >
          ← MENU
        </button>
        <img
          src="/assets/logo21stCM_no_white_1.png"
          className="h-10 md:h-20"
          alt="logo"
        />
      </div>

      <main className="flex flex-col items-center py-2 md:py-4 gap-4 md:gap-8">
        <div className="w-full max-w-[95%] px-2 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
              <div className="flex flex-col items-center">
                <span className="text-[8px] md:text-[10px] tracking-[0.25em] text-black/40 font-semibold uppercase">
                  Beat
                </span>

                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white text-black flex items-center justify-center text-xl md:text-2xl font-black italic
  shadow-[4px_4px_0px_#000] border-2 border-black"
                >
                  {currentTick < 1 ? 1 : currentTick}
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white mt-4">
                Pulsa al{" "}
                <span className="bg-white text-black px-2 py-[1px] rounded">
                  ritmo
                </span>
              </h2>
            </div>

            {/* Widget de Configuración */}
            <div className="w-full md:max-w-xs lg:max-w-sm">
              {/* Información de Sesión (BPM . MEASURES) */}
              <div className="flex justify-end gap-2 mb-2 px-4 opacity-80 text-[9px] font-bold tracking-[0.2em] uppercase italic">
                <span>{localBpm} BPM</span>
                <span className="text-black opacity-60">·</span>
                <span>{measures} Measures</span>
              </div>

              <div className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/5">
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] tracking-[0.3em] opacity-40 uppercase font-black text-white">
                      Tempo
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-black italic text-amber-400 tracking-tighter">
                        {localBpm}
                      </span>
                      <span className="text-[9px] font-bold opacity-30 text-white">
                        BPM
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    value={localBpm}
                    disabled={isPlaying}
                    onChange={(e) => setLocalBpm(Number(e.target.value))}
                    onMouseUp={() => setBpm(localBpm)}
                    onTouchEnd={() => setBpm(localBpm)}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[7px] font-bold opacity-20 tracking-widest uppercase">
                    <span>Largo</span>
                    <span>Andante</span>
                    <span>Allegro</span>
                    <span>Presto</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[95%] bg-white rounded-[2rem] md:rounded-[2.5rem] h-48 flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden">
          <SimpleMovingScore
            ref={musicRef}
            BPM={bpmRef}
            onComplete={onGameEnd}
            setBeat={setCurrentTick}
          />
        </div>

        <div
          onPointerDown={(e) => {
            e.preventDefault();
            handleTap();
          }}
          className={`w-full max-w-[85%] md:max-w-[65%] h-32 md:h-40 rounded-[2rem] border flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-100 ease-out
            ${flash ? "bg-black/60 border-white/30 scale-[0.98]" : "bg-black/40 border-white/10 backdrop-blur-md scale-100 shadow-xl"}`}
        >
          {!isPlaying ? (
            <div className="text-center">
              <span className="font-black tracking-[0.2em] text-sm md:text-base animate-pulse block">
                TAP TO START
              </span>
              <span className="text-[9px] md:text-[10px] opacity-50 mt-1 block">
                (OR PRESS SPACE)
              </span>
            </div>
          ) : (
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-all ${flash ? "border-amber-400 scale-90" : "border-white/20"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${flash ? "bg-amber-400" : "bg-white opacity-40"}`}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="pb-4 md:pb-8 text-center text-slate-500 text-[7px] md:text-[8px] tracking-[0.4em] uppercase mt-auto">
        © 2026 21st Century Music
      </footer>
    </div>
  );
}
