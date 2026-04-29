"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

import { createMetronome, getCtx } from "./metronome"; //

const BRAVURA_URL = "/assets/bravura.woff2";

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

const VALUES = [
  // { note: G.whole, rest: G.wholeRest, beats: 4 },
  // { note: G.half, rest: G.halfRest, beats: 2 },
  // { note: G.quarter, rest: G.quarterRest, beats: 1 },
  { note: G.eighth, rest: G.eighthRest, beats: 0.5 },
];

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

export interface MusicRef {
  handleStart: () => void;
}
interface SimpleMovingScoreProps {
  BPM?: number;
  onComplete?: (data: number[]) => void;
}

const SimpleMovingScore = forwardRef<MusicRef, SimpleMovingScoreProps>(
  ({ BPM = 100, onComplete }, ref) => {
    // ... resto del componente+
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fontLoaded, setFontLoaded] = useState(false);

    const speedRef = useRef(0);
    const startTimeRef = useRef<number>(0);
    const beforeStart = useRef<number>(0.5);
    const requestRef = useRef<number>(0);

    const ctxCanvasRef = useRef<CanvasRenderingContext2D | null>(null);

    const metronomeRef = useRef<ReturnType<typeof createMetronome> | null>(
      null,
    );

    // Constants for drawing
    const BEAT_WIDTH = 100;
    const HEIGHT = 120;
    const pixels = 50;

    const MY_SCORE = [
      { glyph: G.barline, beats: 0 },
      { glyph: G.quarterRest, beats: 1 },
      { glyph: G.quarterRest, beats: 1 },
      { glyph: G.quarterRest, beats: 1 },
      { glyph: G.quarterRest, beats: 1 },
      ...createScore(4),
    ];

    let xi = 0;

    MY_SCORE.forEach((item) => {
      item.xi = xi; // position BEFORE drawing

      xi += item.beats > 0 ? (item.beats * BEAT_WIDTH) ** 0.9 : 15;
    });

    const SECONDS_PER_BEAT = 60 / BPM;
    let acc = 0;

    const TIME_LINE = MY_SCORE.filter((ele) => ele.beats !== 0) // Only rhythmic elements
      .reduce((list, ele) => {
        list.push(acc); // Push the current start time
        acc += ele.beats * SECONDS_PER_BEAT;
        return list;
      }, []);

    TIME_LINE.push(acc); // Push the final duration/end point

    // 2. LENGTH_LINE: The xi positions, omitting all barlines except the last one
    const LENGTH_LINE = MY_SCORE.filter((item, index) => {
      const isBarline = item.glyph === G.barline;
      const isLast = index === MY_SCORE.length - 1;
      return !isBarline || isLast;
    }).map((item) => item.xi);

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
      ctx.lineTo(MY_SCORE[MY_SCORE.length - 1].xi + 25, midY);
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

      // MY_SCORE.forEach((item) => {
      //   const y = item.glyph === G.barline ? midY + pixels / 2 : midY;
      //   ctx.fillText(item.glyph, cursorX, y);
      //   cursorX += item.beats > 0 ? (item.beats * BEAT_WIDTH) ** 0.9 : 15;
      // });

      MY_SCORE.forEach((item) => {
        const y = item.glyph === G.barline ? midY + pixels / 2 : midY;

        ctx.fillStyle = item.glyph === G.eighth ? "#c23d3d" : "#111";

        ctx.fillText(item.glyph, item.xi + 25, y);
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

    let posIndex = 0;
    let scrollX = 0;
    let scrollXBase = 0;
    let timeBase = 0;
    // 2. Animation loop
    // const animate = (time: number) => {
    //   const ctx = ctxCanvasRef.current;
    //   if (!ctx) return;

    //   const timecurrent = getCtx().currentTime;

    //   if (timecurrent > startTimeRef.current + TIME_LINE[posIndex]) {
    //     scrollX = LENGTH_LINE[posIndex];
    //     posIndex++;
    //   }

    //   draw(ctx, scrollX, window.innerWidth);

    //   requestRef.current = requestAnimationFrame(animate);
    // };

    const animate = () => {
      const ctx = ctxCanvasRef.current;
      if (!ctx) return;

      const timecurrent = getCtx().currentTime;

      if (posIndex >= TIME_LINE.length) {
        scrollX = LENGTH_LINE[LENGTH_LINE.length - 1];
        draw(ctx, scrollX, window.innerWidth);

        speedRef.current = 0;
        cancelAnimationFrame(requestRef.current);
        if (metronomeRef.current) metronomeRef.current.stop();

        // TRIGER THE CALLBACK HERE
        if (onComplete) {
          let acc = 0;

          const data = MY_SCORE.filter((ele) => ele.beats !== 0)
            .reduce<number[]>((list, ele) => {
              if (ele.glyph === G.eighth) {
                list.push(acc);
              }

              acc += ele.beats * SECONDS_PER_BEAT;
              return list;
            }, [])
            .map((ele) => ele + startTimeRef.current);

          onComplete?.(data);
        }
        return;
      }

      // ... rest of your animation logic ...
      if (timecurrent > startTimeRef.current + TIME_LINE[posIndex]) {
        scrollXBase = scrollX;
        timeBase = timecurrent;
        posIndex++;

        speedRef.current =
          (LENGTH_LINE[posIndex] - scrollXBase) /
          (startTimeRef.current + TIME_LINE[posIndex] - timeBase);
      }
      scrollX = scrollXBase + speedRef.current * (timecurrent - timeBase);
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

    useImperativeHandle(ref, () => ({
      handleStart: () => {
        posIndex = 0; // Reset local variables so it can play again
        scrollX = 0;
        scrollXBase = 0;
        timeBase = 0;
        const canvas = canvasRef.current;
        if (!canvas) return;

        ctxCanvasRef.current = canvas.getContext("2d");
        // 1. Iniciar Metrónomo (ejemplo a 100 BPM)
        if (!metronomeRef.current) {
          metronomeRef.current = createMetronome(BPM);
        }

        // 2. Iniciar Animación
        speedRef.current = 0;
        startTimeRef.current = getCtx().currentTime + beforeStart.current;
        metronomeRef.current.start(startTimeRef.current);
        (window as any).audioCtx = getCtx();
        requestAnimationFrame(animate);
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
