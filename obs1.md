"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCtx } from "./metronome";
import SimpleMovingScore from "./MusicDisplay";

export default function RitmoGame() {
const router = useRouter();
const [isPlaying, setIsPlaying] = useState(false);
const [flash, setFlash] = useState(false);

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
    setTimeout(() => setFlash(false), 100);

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
style={{ backgroundImage: "url('/assets/background.jpeg')" }} >
{/_ Header _/}
<div className="pt-6 px-6 flex justify-between items-center z-10">
<button
onClick={() => router.push("/")}
className="bg-black/40 px-4 p-2 rounded-full border border-white/10 text-[10px] font-bold hover:bg-white/20 transition-colors" >
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
            e.preventDefault();
            handleTap();
          }}
          className={`
            w-full max-w-[65%] h-40 rounded-[2rem] border flex flex-col items-center justify-center cursor-pointer select-none
            transition-all duration-100 ease-out
            ${
              flash
                ? "bg-black/60 border-white/30 scale-[0.97] shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)]"
                : "bg-black/40 border-white/15 backdrop-blur-md scale-100 shadow-xl"
            }
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
            <div className="flex items-end gap-[5px] h-16">
              <style>{`
                @keyframes eq { 0%,100% { height: var(--min); } 50% { height: var(--max); } }
                .bar { animation: eq var(--spd) ease-in-out infinite; }
              `}</style>
              {[
                { min: "6px",  max: "28px", spd: "0.6s"  },
                { min: "10px", max: "48px", spd: "0.45s" },
                { min: "4px",  max: "56px", spd: "0.55s" },
                { min: "12px", max: "64px", spd: "0.4s"  },
                { min: "4px",  max: "56px", spd: "0.55s" },
                { min: "10px", max: "48px", spd: "0.45s" },
                { min: "6px",  max: "28px", spd: "0.6s"  },
              ].map((b, i) => (
                <div
                  key={i}
                  className={`bar w-2.5 rounded-full transition-colors duration-75 ${
                    flash ? "bg-amber-400" : "bg-white/40"
                  }`}
                  style={{ "--min": b.min, "--max": b.max, "--spd": b.spd } as React.CSSProperties}
                />
              ))}
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
