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
  handleStart: (isPlaying: boolean) => void;
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

    const TAP_RUN_TIMES = useRef<number[]>([]);

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
      ctx.translate(-scrollX + 270, 0);

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
        let y = item.glyph === G.barline ? midY + pixels / 2 : midY;
        let x = item.xi + 25;

        ctx.fillText(item.glyph, x, y);

        if (item.glyph === G.eighth) {
          //

          //
          ctx.strokeStyle = "red";
          ctx.lineWidth = 2;
          x += 17;
          y -= 55;
          ctx.beginPath();
          // Draw a small 'X' over the note head
          ctx.moveTo(x - 5, y - 5);
          ctx.lineTo(x + 5, y + 5);
          ctx.moveTo(x + 5, y - 5);
          ctx.lineTo(x - 5, y + 5);
          ctx.stroke();

          //OR
        }
      });

      TAP_RUN_TIMES.current.forEach((x) => {
        //OR

        ctx.beginPath();
        // Dibujamos un círculo pequeño (indicador) justo bajo la nota
        ctx.arc(x, midY + 30, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#7a6e33";
        ctx.fill();
      });

      ctx.restore();

      // Playhead (Static)
      const x = 296;
      const top = 10;
      const size = 7;
      const lineHeight = HEIGHT - 50;

      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x - 4, top + size);
      ctx.lineTo(x + 4, top + size);
      ctx.closePath();
      ctx.fillStyle = "#239c4f";
      ctx.fill();
      ctx.fillRect(x - 1, top + size, 2, lineHeight);
    };

    const scrollX = useRef(0);
    const scrollXBase = useRef(0);
    const timeBase = useRef(0);
    const posIndex = useRef(0);
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

      if (posIndex.current >= TIME_LINE.length - 0) {
        scrollX.current = LENGTH_LINE[LENGTH_LINE.length - 1];

        speedRef.current = 70;
        cancelAnimationFrame(requestRef.current);
        draw(ctx, scrollX.current, window.innerWidth);
        metronomeRef.current?.stop();

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

          onComplete(data);
        }
        return;
      }

      if (timecurrent > startTimeRef.current + TIME_LINE[posIndex.current]) {
        scrollXBase.current = scrollX.current;
        timeBase.current = timecurrent;

        posIndex.current++;

        speedRef.current =
          (LENGTH_LINE[posIndex.current] - scrollXBase.current) /
          (startTimeRef.current +
            TIME_LINE[posIndex.current] -
            timeBase.current);
      }

      scrollX.current =
        scrollXBase.current +
        speedRef.current * (timecurrent - timeBase.current);

      draw(ctx, scrollX.current, window.innerWidth);

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
      handleStart: (isPlaying: boolean) => {
        if (!isPlaying) {
          posIndex.current = 0;
          scrollX.current = 0;
          scrollXBase.current = 0;
          timeBase.current = 0;

          TAP_RUN_TIMES.current = [];

          const canvas = canvasRef.current;
          if (!canvas) return;

          ctxCanvasRef.current = canvas.getContext("2d");

          if (!metronomeRef.current) {
            metronomeRef.current = createMetronome(BPM);
          }

          speedRef.current = 0;
          startTimeRef.current = getCtx().currentTime + beforeStart.current;

          metronomeRef.current.start(startTimeRef.current);
          requestAnimationFrame(animate);
        } else {
          TAP_RUN_TIMES.current.push(scrollX.current + 25);
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

    //

    //

    //

    const isDragging = useRef(false);
    const lastMouseX = useRef(0);

    const updateByMouse = (clientX: number) => {
      const dx = clientX - lastMouseX.current;

      scrollX.current -= dx;
      lastMouseX.current = clientX;

      const ctx = canvasRef.current.getContext("2d");
      console.log("4553terret");
      if (!ctx) return;
      console.log("354tt");

      if (scrollX.current < 0) {
        scrollX.current = 0;
      }

      draw(ctx, scrollX.current, window.innerWidth);
    };

    useEffect(() => {
      if (!fontLoaded) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      console.log("3eiei");

      const onDown = (e: MouseEvent) => {
        isDragging.current = true;
        lastMouseX.current = e.clientX;
      };

      const onMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        updateByMouse(e.clientX);
      };

      const onUp = () => {
        isDragging.current = false;
      };

      canvas.addEventListener("mousedown", onDown);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);

      return () => {
        canvas.removeEventListener("mousedown", onDown);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    }, [fontLoaded]);

    return (
      <div style={{ background: "transparent", width: "100%" }}>
        {!fontLoaded ? null : (
          <canvas ref={canvasRef} className="cursor-pointer" />
        )}
      </div>
    );
  },
);

SimpleMovingScore.displayName = "SimpleMovingScore";
export default SimpleMovingScore;
