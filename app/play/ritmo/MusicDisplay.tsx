"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

import { createMetronome } from "./metronome"; //

const BRAVURA_URL =
  "https://cdn.jsdelivr.net/npm/@vexflow-fonts/bravura/bravura.woff2";

const G = {
  whole: "\uE1D2",
  half: "\uE1D3",
  quarter: "\uE1D5",
  eighth: "\uE1D7",
  wholeRest: "\uE4E3",
  halfRest: "\uE4E4",
  quarterRest: "\uE4E5",
  eighthRest: "\uE4E6",
  barline: "\uE030",
  time4: "\uE084",
};

const VALUES = [{ note: G.eighth, rest: G.eighthRest, beats: 0.5 }];

const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const createScore = (measures: number) => {
  const score: any[] = [];
  for (let m = 0; m < measures; m++) {
    let remaining = 2;
    score.push({ glyph: G.barline, beats: 0 });
    while (remaining > 0) {
      const options = VALUES.filter((v) => v.beats <= remaining);
      const chosen = rand(options);
      const glyph = Math.random() < 0.5 ? chosen.note : chosen.rest;
      score.push({ glyph, beats: chosen.beats });
      remaining -= chosen.beats;
    }
    score.push({ glyph: G.halfRest, beats: 2 });
  }
  score.push({ glyph: G.barline, beats: 0 });
  return score;
};

const MY_SCORE = [
  { glyph: G.barline, beats: 0 },
  { glyph: G.quarterRest, beats: 1 },
  { glyph: G.quarterRest, beats: 1 },
  { glyph: G.quarterRest, beats: 1 },
  { glyph: G.quarterRest, beats: 1 },
  ...createScore(24),
];

export interface MusicRef {
  handleStart: () => void;
}

interface SimpleMovingScoreProps {
  bpm?: number; // El signo ? lo hace opcional
}

const SimpleMovingScore = forwardRef<MusicRef, SimpleMovingScoreProps>(
  ({ bpm = 100 }, ref) => {
    // ... resto del componente+
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fontLoaded, setFontLoaded] = useState(false);

    const speedRef = useRef(0);
    const startTimeRef = useRef<number>(0);
    const requestRef = useRef<number>(0);

    // Constants for drawing
    const BEAT_WIDTH = 60;
    const HEIGHT = 120;
    const pixels = 30;

    // 1. The core drawing logic (reusable for static and animated frames)
    const draw = (
      ctx: CanvasRenderingContext2D,
      scrollX: number,
      width: number,
    ) => {
      ctx.clearRect(0, 0, width * 2, HEIGHT * 2); // Multiplied by 2 for DPR safety
      ctx.save();
      ctx.translate(-scrollX + 70, 0);

      const midY = HEIGHT / 2;

      // Staff line
      ctx.beginPath();
      ctx.moveTo(25, midY);
      ctx.lineTo(10000, midY);
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = `${pixels}px Bravura`;
      ctx.fillStyle = "#111";

      let cursorX = 0;
      // Time signature
      ctx.fillText(G.time4, cursorX, midY + 10);
      ctx.fillText(G.time4, cursorX, midY - 10);
      cursorX += 25;

      MY_SCORE.forEach((item) => {
        const y = item.glyph === G.barline ? midY + pixels / 2 : midY;
        ctx.fillText(item.glyph, cursorX, y);
        cursorX += item.beats > 0 ? item.beats * BEAT_WIDTH : 15;
      });
      ctx.restore();

      // Playhead (Static)
      const x = 75;
      const top = 10;
      const size = 7;
      const lineHeight = HEIGHT - 50;

      ctx.beginPath();
      ctx.moveTo(x + 20, top);
      ctx.lineTo(x - 4 + 20, top + size);
      ctx.lineTo(x + 4 + 20, top + size);
      ctx.closePath();
      ctx.fillStyle = "#239c4f";
      ctx.fill();
      ctx.fillRect(x - 1 + 20, top + size, 2, lineHeight);
    };

    // 2. Animation loop
    const animate = (time: number) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = (time - startTimeRef.current) / 1000;
      const scrollX = elapsed * speedRef.current;

      draw(ctx, scrollX, window.innerWidth);
      requestRef.current = requestAnimationFrame(animate);
    };

    //
    //

    //
    //

    //
    //

    //
    //

    const metronomeRef = useRef<ReturnType<typeof createMetronome> | null>(
      null,
    );

    useImperativeHandle(ref, () => ({
      handleStart: () => {
        if (speedRef.current === 0) {
          // 1. Iniciar Metrónomo (ejemplo a 100 BPM)
          if (!metronomeRef.current) {
            metronomeRef.current = createMetronome(bpm);
          }
          metronomeRef.current.start();

          // 2. Iniciar Animación
          speedRef.current = 50;
          startTimeRef.current = performance.now();
          requestAnimationFrame(animate);
        }
      },
    }));

    // No olvides limpiar el metrónomo cuando el componente se desmonte
    useEffect(() => {
      return () => {
        metronomeRef.current?.stop();
        cancelAnimationFrame(requestRef.current);
      };
    }, []);
    // Load Font
    useEffect(() => {
      const font = new FontFace("Bravura", `url(${BRAVURA_URL})`);
      font.load().then((f) => {
        document.fonts.add(f);
        setFontLoaded(true);
      });
    }, []);

    //
    //

    //
    //

    //
    //

    //
    //

    // Handle Resize and Initial Paint
    useEffect(() => {
      if (!fontLoaded) return;

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const dpr = window.devicePixelRatio || 1;

      const resize = () => {
        canvas.width = window.innerWidth * dpr;
        canvas.height = HEIGHT * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${HEIGHT}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset scale
        draw(ctx, 0, window.innerWidth); // Static draw at 0
      };

      window.addEventListener("resize", resize);
      resize();

      return () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(requestRef.current);
      };
    }, [fontLoaded]);

    return (
      <div style={{ background: "transparent", width: "100%" }}>
        {!fontLoaded ? null : <canvas ref={canvasRef} />}
      </div>
    );
  },
);

SimpleMovingScore.displayName = "SimpleMovingScore";
export default SimpleMovingScore;
