"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import GameChrome from "@/app/components/GameChrome";
import GameOverModal from "@/app/components/GameOverModal";
import { getCtx } from "./metronome";
import SimpleMovingScore, { type MusicRef } from "./MusicDisplay";
import type { RhythmLevel } from "@/lib/rhythm";
import Backdrop from "@/app/components/Backdrop";
import { outputNode } from "@/lib/audioContext";

/** Compases con los que arranca la sesión, si el nivel los ofrece. */
const preferredMeasures = (options: number[]) =>
  options.includes(24) ? 24 : options[options.length - 1];

export default function RhythmGame({ level }: { level: RhythmLevel }) {
  const measureOptions = level.measureOptions;

  const [isPlaying, setIsPlaying] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showScore, setShowScore] = useState(false);

  const [scoreData, setScoreData] = useState({
    hits: 0,
    misses: 0,
    percentage: 0,
  });

  const [bpm, setBpm] = useState(level.defaultBpm);
  const [localBpm, setLocalBpm] = useState(level.defaultBpm);
  const [measures, setMeasures] = useState(preferredMeasures(measureOptions));
  const [currentTick, setCurrentTick] = useState(1);

  const tapsRef = useRef<{ id: number; time: number }[]>([]);
  const musicRef = useRef<MusicRef>(null);

  const bpmRef = useRef<number>(level.defaultBpm);
  const measuresRef = useRef<number>(preferredMeasures(measureOptions));

  const onGameEnd = useCallback((endType: string, data: Record<string, number> = {}) => {
    setIsPlaying(false);

    if (endType == "reset") return;

    const played = (data.correct_notes ?? 0) + (data.failed_notes ?? 0);

    setScoreData({
      hits: data.correct_measures ?? 0,
      misses: data.failed_measures ?? 0,
      percentage:
        played === 0
          ? 0
          : Math.round(
              (((data.correct_notes ?? 0) / played) * 100) /
                Math.max(1, tapsRef.current.length / played),
            ),
    });

    setShowScore(true);
  }, []);

  const playTapSound = (time: number) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(1.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
    osc.connect(gain);
    gain.connect(outputNode(ctx));
    osc.start(time);
    osc.stop(time + 0.03);
  };

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

  useEffect(() => {
    bpmRef.current = bpm;
    musicRef.current?.handleBPMChange(bpm);
  }, [bpm]);

  useEffect(() => {
    measuresRef.current = measures;
    musicRef.current?.handleMeasuresChange();
  }, [measures]);

  const [openMeasures, setOpenMeasures] = useState(false);

  return (
    <div className="min-h-screen flex flex-col text-white font-sans relative overflow-x-hidden">
      <Backdrop />

      <div className="relative z-10 min-h-screen flex flex-col">
      {/* Pop-up de Marcador */}
      {showScore && scoreData.hits + scoreData.misses > 0 && (
        <GameOverModal
          correct={scoreData.hits}
          total={scoreData.hits + scoreData.misses}
          onRestart={() => setShowScore(false)}
        />
      )}

      <GameChrome>
        Pulsa al{" "}
        <span className="bg-white text-black px-2 py-[1px] rounded">ritmo</span>
      </GameChrome>

      <main className="flex flex-col items-center py-2 md:py-4 gap-4 md:gap-8">
        <div className="w-full max-w-[95%] px-2 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
              <div className="flex flex-col items-center">
                <span className="text-[8px] md:text-[10px] tracking-[0.25em] text-black/40 font-semibold uppercase">
                  Beat
                </span>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white text-black flex items-center justify-center text-xl md:text-2xl font-black italic shadow-[4px_4px_0px_#000] border-2 border-black">
                  {currentTick < 1 ? 1 : currentTick}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] tracking-[0.25em] opacity-40 font-black uppercase">
                  {level.title}
                </span>
                <span className="max-w-[16rem] text-[10px] md:text-xs leading-tight opacity-70">
                  {level.desc}
                </span>
              </div>
            </div>

            {/* Widget de Configuración */}
            <div className="w-full max-w-md md:max-w-xs lg:max-w-sm">
              {/* Session info */}
              <div className="flex justify-end gap-2 mb-2 px-4 opacity-80 text-[9px] font-bold tracking-[0.2em] uppercase italic">
                <span>{localBpm} BPM</span>
                <span className="text-black opacity-60">·</span>
                <span>{measures} Measures</span>
              </div>

              <div className="bg-black/60 backdrop-blur-xl px-4 py-3 rounded-3xl border border-white/5">
                <div className="flex items-center gap-3">
                  {/* ── Tempo (left, grows) ── */}
                  <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[8px] tracking-[0.25em] opacity-40 uppercase font-black text-white">
                        Tempo
                      </span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-lg pr-1 font-black italic text-amber-400 tracking-tighter leading-none">
                          {localBpm}
                        </span>
                        <span className="text-[8px] font-bold opacity-30 text-white">
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
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-between text-[6px] font-bold opacity-20 tracking-widest uppercase">
                      <span>Largo</span>
                      <span>Andante</span>
                      <span>Allegro</span>
                      <span>Presto</span>
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="w-px self-stretch bg-white/8 shrink-0" />

                  {/* ── Measures (right, fixed width) ── */}
                  <div className="flex flex-col items-center gap-1.5 w-18 shrink-0 z-80">
                    <span className="text-[8px] tracking-[0.25em] opacity-40 uppercase font-black text-white">
                      Measures
                    </span>
                    <div className="relative w-16 z-80">
                      <button
                        disabled={isPlaying}
                        onClick={() => setOpenMeasures((prev) => !prev)}
                        className="w-full bg-white/5 border border-white/10 text-white text-sm font-black italic text-amber-400
      rounded-xl px-2 py-1.5 flex items-center justify-center gap-1
      disabled:opacity-40 disabled:cursor-not-allowed
      hover:bg-white/10 transition-colors cursor-pointer z-80"
                      >
                        {measures}
                      </button>

                      {openMeasures && !isPlaying && (
                        <div className="z-80 px-1 py-1 absolute top-full flex flex-col gap-1 mt-1 w-full bg-black/60  border border-white/10 rounded-xl shadow-xl overflow-hidden  animate-in fade-in zoom-in-95">
                          {measureOptions.map((opt) => (
                            <div
                              key={opt}
                              onClick={() => {
                                setMeasures(opt);
                                setOpenMeasures(false);
                              }}
                              className={` py-1 rounded-lg text-center text-sm font-bold cursor-pointer z-80
            hover:bg-white/10 transition-colors
            ${measures === opt ? "text-amber-400" : "text-white"}`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* invisible spacer to match the label-row height of tempo */}
                    <div className="h-[10px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* `data-score-frame`: es esta caja la que mide el canvas para saber
            de cuanto ancho dispone. Su ancho lo pone el CSS de aqui y no
            depende de lo que lleve dentro, que es justo lo que hace que se
            pueda medir sin morderse la cola. */}
        <div
          data-score-frame
          className="w-full max-w-[95%] bg-white rounded-[2rem] md:rounded-[2.5rem] h-56 flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden"
          style={{ pointerEvents: openMeasures ? "none" : "auto" }}
        >
          <SimpleMovingScore
            ref={musicRef}
            level={level}
            BPM={bpmRef}
            measures={measuresRef}
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
    </div>
  );
}
