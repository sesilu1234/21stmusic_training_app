"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
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
  onComplete?: (endType: string, data: any) => void;
  setBeat?: (beat: number) => void;
}

const SimpleMovingScore = forwardRef<MusicRef, SimpleMovingScoreProps>(
  ({ BPM = 100, onComplete, setBeat }, ref) => {
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

    const gameRef = useRef<ReturnType<typeof createGameState> | null>(null);

    const TAP_RUN_TIMES = useRef<number[]>([]);

    const notFirstTime = useRef<boolean>(false);

    //

    const scrollX = useRef(0);
    const scrollXBase = useRef(0);
    const timeBase = useRef(0);
    const posIndex = useRef(0);

    //
    //
    const currentNoteIndex = useRef(0);

    const FAIL_MARGIN_UPPER = 0.15;
    const FAIL_MARGIN_LOWER = 0.01;

    // Constants for drawing
    const BEAT_WIDTH = 100;
    const HEIGHT = 120;
    const pixels = 50;

    const w = typeof window !== "undefined" ? window.innerWidth : 0;

    const translatedRef = useRef(
      w < 710 ? 30 : w < 1070 ? 100 : w < 1400 ? 250 : 470,
    );
    const STATE = {
      CORRECT: 0,
      FAILED: 1,
      TO_COME: 2,
    } as const;

    function createGameState(BPM: number) {
      const score = [
        { glyph: G.barline, beats: 0 },
        { glyph: G.quarterRest, beats: 1 },
        { glyph: G.quarterRest, beats: 1 },
        { glyph: G.quarterRest, beats: 1 },
        { glyph: G.quarterRest, beats: 1 },
        ...createScore(4),
      ];

      let xi = 0;
      score.forEach((item) => {
        item.xi = xi;
        item.status = 2;
        xi += item.beats > 0 ? (item.beats * BEAT_WIDTH) ** 0.9 : 15;
      });

      const SECONDS_PER_BEAT = 60 / BPM;

      let acc = 0;
      const TIME_LINE = score
        .filter((ele) => ele.beats !== 0)
        .map((ele) => {
          const t = acc;
          acc += ele.beats * SECONDS_PER_BEAT;
          return t;
        });

      TIME_LINE.push(acc);

      acc = 0;
      const TIME_LINE_NOTES = score
        .map((item, i) => {
          const t = acc;
          if (item.beats !== 0) acc += item.beats * SECONDS_PER_BEAT;
          if (VALUES.some((v) => v.note === item.glyph)) {
            return { index: i, time: t };
          }
          return null;
        })
        .filter(Boolean);

      const LENGTH_LINE = score
        .filter((item, index) => {
          const isBarline = item.glyph === G.barline;
          const isLast = index === score.length - 1;
          return !isBarline || isLast;
        })
        .map((item) => item.xi);

      return { score, TIME_LINE, LENGTH_LINE, TIME_LINE_NOTES };
    }

    function initGame() {
      console.log("ewwe");
      gameRef.current = createGameState(BPM);

      currentNoteIndex.current = 0;
      posIndex.current = 0;

      scrollX.current = 0;
      scrollXBase.current = 0;
      timeBase.current = 0;
      speedRef.current = 0;

      TAP_RUN_TIMES.current = [];
    }

    if (!gameRef.current) {
      initGame();
    }

    // 1. The core drawing logic (reusable for static and animated frames)
    const draw = (
      ctx: CanvasRenderingContext2D,
      scrollX: number,
      width: number,
    ) => {
      ctx.clearRect(0, 0, width * 2, HEIGHT * 2); // Multiplied by 2 for DPR safety
      ctx.save();
      ctx.translate(-scrollX + translatedRef.current, 0);

      const midY = HEIGHT / 2;

      // Staff line
      ctx.beginPath();
      ctx.moveTo(25, midY);
      ctx.lineTo(
        gameRef.current!.score[gameRef.current!.score.length - 1].xi + 25,
        midY,
      );
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

      gameRef.current!.score.forEach((item, j) => {
        let y = item.glyph === G.barline ? midY + pixels / 2 : midY;
        let x = item.xi + 25;

        ctx.fillText(item.glyph, x, y);

        if (item.glyph === G.eighth) {
          //
          if (item.status == 0) {
            //
            ctx.strokeStyle = "green";
            ctx.lineWidth = 2;
            x += 17;
            y -= 55;

            ctx.beginPath();
            // check ✓
            ctx.moveTo(x - 6, y);
            ctx.lineTo(x - 1, y + 5);
            ctx.lineTo(x + 6, y - 5);
            ctx.stroke();
          } else if (item.status == 1) {
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
          }

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
      const x = 26 + translatedRef.current;
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

    //
    //
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

      const game = gameRef.current!;
      const score = game.score;
      const TIME_LINE = game.TIME_LINE;
      const TIME_LINE_NOTES = game.TIME_LINE_NOTES;
      const LENGTH_LINE = game.LENGTH_LINE;

      const timecurrent = getCtx().currentTime;

      const secondsPerBeat = 60 / BPM;
      const beatFloat = (timecurrent - startTimeRef.current) / secondsPerBeat;

      const beat = Math.floor(beatFloat) % 4;

      setBeat?.(beat + 1);

      if (
        currentNoteIndex.current < TIME_LINE_NOTES.length &&
        timecurrent >
          startTimeRef.current +
            TIME_LINE_NOTES[currentNoteIndex.current]!.time +
            FAIL_MARGIN_UPPER
      ) {
        score[TIME_LINE_NOTES[currentNoteIndex.current]!.index].status = 1;
        currentNoteIndex.current++;
      }

      if (timecurrent > startTimeRef.current + TIME_LINE[posIndex.current]) {
        scrollXBase.current = scrollX.current;
        timeBase.current = timecurrent;

        posIndex.current++;

        if (posIndex.current >= TIME_LINE.length) {
          scrollX.current = LENGTH_LINE[LENGTH_LINE.length - 1];

          cancelAnimationFrame(requestRef.current);
          draw(ctx, scrollX.current, window.innerWidth);
          metronomeRef.current?.stop();
          setShowReset(false);
          setShowDrag(true);

          if (onComplete) {
            let bag: any[][] = [];
            let bag_aux: any[] = [];

            let correct_notes = 0;
            let failed_notes = 0;

            for (const ele of score) {
              if (ele.status === 0) correct_notes++;
              if (ele.status === 1) failed_notes++;

              if (ele.glyph === G.barline) {
                bag.push([...bag_aux]);
                bag_aux = [];
              } else {
                if (VALUES.some((v) => v.note === ele.glyph)) {
                  bag_aux.push(ele);
                }
              }
            }

            if (bag_aux.length > 0) {
              bag.push(bag_aux);
            }

            const measures_scores = bag.filter((group) => group.length > 0);

            let correct_measures = 0;
            let failed_measures = 0;

            for (const measure of measures_scores) {
              const allCorrect = measure.every((item) => item.status === 0);

              if (allCorrect) {
                correct_measures++;
              } else {
                failed_measures++;
              }
            }

            const data = {
              correct_notes,
              failed_notes,
              correct_measures,
              failed_measures,
            };

            onComplete("end", data);
          }
          return;
        } else {
          speedRef.current =
            (LENGTH_LINE[posIndex.current] - scrollXBase.current) /
            (startTimeRef.current +
              TIME_LINE[posIndex.current] -
              timeBase.current);
        }
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
          if (!fontLoaded) {
            onComplete?.("reset", []);
            return;
          }

          if (notFirstTime.current) {
            initGame();
          }

          notFirstTime.current = true;

          const canvas = canvasRef.current;
          if (!canvas) return;

          ctxCanvasRef.current = canvas.getContext("2d");

          if (!metronomeRef.current) {
            metronomeRef.current = createMetronome(BPM);
          }

          speedRef.current = 0;
          startTimeRef.current = getCtx().currentTime + beforeStart.current;

          metronomeRef.current.start(startTimeRef.current);
          setShowReset(true);
          setShowDrag(false);

          requestAnimationFrame(animate);
        } else {
          const game = gameRef.current!;
          const TIME_LINE_NOTES = game.TIME_LINE_NOTES;
          const score = game.score;

          const currentTapTime = getCtx().currentTime - startTimeRef.current;
          const note = TIME_LINE_NOTES[currentNoteIndex.current];

          if (
            note &&
            currentTapTime >= note.time + FAIL_MARGIN_LOWER &&
            currentTapTime <= note.time + FAIL_MARGIN_UPPER
          ) {
            score[note.index].status = 0;
            currentNoteIndex.current++;
          }

          TAP_RUN_TIMES.current.push(scrollX.current + 25);
        }
      },
    }));
    // No olvides limpiar el metrónomo cuando el componente se desmonteconsoc
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

    const updateByPointer = (clientX: number) => {
      const dx = clientX - lastMouseX.current;

      scrollX.current -= dx;
      lastMouseX.current = clientX;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (scrollX.current < 0) {
        scrollX.current = 0;
      }

      draw(ctx, scrollX.current, window.innerWidth);
    };

    useEffect(() => {
      if (!fontLoaded) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const onPointerDown = (e: PointerEvent) => {
        isDragging.current = true;
        lastMouseX.current = e.clientX;

        canvasRef.current!.style.cursor = "move";
        canvasRef.current!.style.cursor = 'url("/assets/grabi.cur"), grabbing';
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging.current) return;
        updateByPointer(e.clientX);
      };

      const onPointerUp = () => {
        isDragging.current = false;
        canvasRef.current!.style.cursor = "pointer";
      };

      canvas.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);

      return () => {
        canvas.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      };
    }, [fontLoaded]);

    const [showDrag, setShowDrag] = useState(false);
    const [showReset, setShowReset] = useState(false);

    const handleReset = () => {
      //

      //
      initGame();

      //

      notFirstTime.current = false;

      // stop animation
      cancelAnimationFrame(requestRef.current);

      // stop audio
      metronomeRef.current?.stop();

      // reset timing
      startTimeRef.current = 0;

      onComplete?.("reset", []);
      setBeat?.(1);

      // redraw limpio
      const ctx = ctxCanvasRef.current;
      if (ctx) {
        draw(ctx, 0, window.innerWidth);
      }

      // UI
      setShowReset(false);
    };

    return (
      <div style={{ background: "transparent", width: "100%" }}>
        {!fontLoaded ? null : (
          <div className="relative group">
            <canvas
              ref={canvasRef}
              className="cursor-pointer"
              style={{ touchAction: "none" }}
            />

            {showDrag && (
              <div className="absolute -top-5 right-5 flex items-center justify-center pointer-events-none animate-pulse">
                <div className="bg-black/35 px-2 py-1 rounded-lg text-white text-xs backdrop-blur-sm">
                  Drag for review
                </div>
              </div>
            )}
            {showReset && (
              <div
                className="absolute -top-5 right-5 flex items-center justify-center cursor-pointer"
                onClick={handleReset}
              >
                <div className="bg-black/40 px-2 py-1 rounded-lg text-white text-xs backdrop-blur-sm hover:bg-black/60">
                  Reset
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

SimpleMovingScore.displayName = "SimpleMovingScore";
export default React.memo(SimpleMovingScore);
