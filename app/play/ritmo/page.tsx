"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCtx } from "./metronome"; // To sync with the same clock
import SimpleMovingScore from "./MusicDisplay";

export default function RitmoGame() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [flash, setFlash] = useState(false);

  // High-performance storage for your taps
  const tapsRef = useRef<{ id: number; time: number }[]>([]);
  const musicRef = useRef<{ handleStart: (isPlaying: boolean) => void }>(null);

  const onGameEnd = useCallback((data: number[]) => {
    setIsPlaying(false);

    // fetch("/api/save", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     timeline: data,
    //     taps: tapsRef.current,
    //   }),
    // });
  }, []);

  const handleTap = useCallback(() => {
    const ctx = getCtx();

    if (!isPlaying) {
      setIsPlaying(true);
      tapsRef.current = [];
      musicRef.current?.handleStart(isPlaying);
      return;
    }
    musicRef.current?.handleStart(isPlaying);
    const tapTime = ctx.currentTime;

    tapsRef.current.push({
      id: tapsRef.current.length + 1,
      time: tapTime,
    });

    // 🔊 sonido inmediato sincronizado con audio clock
    playTapSound(tapTime);

    setFlash(true);
    setTimeout(() => setFlash(false), 70);
  }, [isPlaying]);

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
  // Global Spacebar Listener

  const playTapSound = (time: number) => {
    const ctx = getCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 1800;

    // más ataque percibido
    gain.gain.setValueAtTime(1.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.03);
  };
  return (
    <div
      className="min-h-screen flex flex-col bg-slate-900 bg-cover bg-center text-white font-sans"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      {/* Header */}
      <div className="pt-6 px-6 flex justify-between items-center z-10">
        <button
          onClick={() => router.push("/")}
          className="bg-black/40 px-4 p-2 rounded-full border border-white/10 text-[10px] font-bold hover:bg-white/20 transition-colors"
        >
          ← MENU
        </button>
        <img
          src="/assets/logo21stCM_no_white_1.png"
          className="h-12 md:h-20"
          alt="logo"
        />
      </div>

      <main className="mt-8 flex flex-col items-center justify-center py-4 gap-8">
        <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
          Pulsa al{" "}
          <span className="bg-white text-black px-2 rounded">RITMO</span>
        </h2>

        {/* The Music Display */}
        <div className="w-full max-w-[95%] bg-white rounded-[2.5rem] h-48 flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden">
          <SimpleMovingScore ref={musicRef} BPM={120} onComplete={onGameEnd} />
        </div>

        {/* The Tap Zone */}
        <div
          onPointerDown={(e) => {
            e.preventDefault(); // Prevents double-firing on mobile (touch + click)
            handleTap();
          }}
          className={`
            w-full max-w-[65%] h-40 rounded-[2rem] border-2 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.95] select-none
            ${flash ? "bg-amber-400 border-white shadow-lg scale-[1.02]" : "bg-black/40 border-white/20 backdrop-blur-md"}
          `}
        >
          {!isPlaying ? (
            <div className="text-center">
              <span className="font-black tracking-[0.2em] animate-pulse block">
                TAP TO START
              </span>
              <span className="text-[10px] opacity-50 mt-2 block">
                (OR PRESS SPACE)
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black">
                {tapsRef.current.length}
              </span>
              <div className="w-12 h-12 rounded-full border-4 border-amber-400 animate-ping opacity-20 absolute" />
            </div>
          )}
        </div>
      </main>

      <footer className="pb-8 text-center text-slate-500 text-[8px] tracking-[0.5em] uppercase mt-auto">
        © 2026 21st Century Music
      </footer>
    </div>
  );
}
