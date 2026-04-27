"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import MusicLine from "./MusicDisplay";

import SimpleMovingScore from "./MusicDisplay11234.tsx";

export default function RitmoGame() {
  const router = useRouter();

  // Only the bare essentials for the UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [flash, setFlash] = useState(false);
  const musicRef = useRef<{ handleStart: () => void }>(null);

  const handleInteraction = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      musicRef.current?.handleStart(); // Let your component take over
    } else {
      // Just a visual feedback for the tap
      setFlash(true);
      setTimeout(() => setFlash(false), 70);
    }
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
          className="bg-black/40 px-4 p-2 rounded-full border border-white/10 text-[10px] font-bold"
        >
          ← MENU
        </button>
        <img
          src="/assets/logo21stCM_no_white_1.png"
          className="h-12 md:h-20"
          alt="logo"
        />
      </div>

      <main className="mt-8 flex flex-col items-center justify-center p-4 gap-8">
        <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
          Pulsa al{" "}
          <span className="bg-white text-black px-2 rounded">RITMO</span>
        </h2>

        {/* The Pentagram / Staff Container */}
        <div className="w-full max-w-[80%] bg-white rounded-[2.5rem] h-48 flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden">
          {/* Your component does all the heavy lifting here */}
          {/* <MusicLine ref={musicRef} bpm={80} /> */}
          <SimpleMovingScore />
        </div>

        {/* The Big Simple Tap Zone */}
        <div
          onPointerDown={handleInteraction}
          className={`
            w-full max-w-2xl h-40 rounded-[2rem] border-2 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.97]
            ${flash ? "bg-amber-400 border-white shadow-lg" : "bg-black/40 border-white/20 backdrop-blur-md"}
          `}
        >
          {!isPlaying ? (
            <span className="font-black tracking-[0.2em] animate-pulse">
              TAP TO START
            </span>
          ) : (
            <div className="w-12 h-12 rounded-full border-4 border-amber-400 animate-ping opacity-20" />
          )}
        </div>
      </main>

      <footer className="pb-8 text-center text-slate-500 text-[8px] tracking-[0.5em] uppercase">
        © 2026 21st Century Music
      </footer>
    </div>
  );
}
