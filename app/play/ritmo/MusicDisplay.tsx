"use client";

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

// ---------------------------------------------------------------------------
// SMuFL glyphs (Bravura)
// ---------------------------------------------------------------------------
const G = {
  quarterUp: "\uE1D5",
  halfUp: "\uE1D3",
  restQuarter: "\uE4E5",
  restHalf: "\uE4E4",
  timeSig4: "\uE084",
  barline: "\uE030",
  noteheadBlack: "\uE0A4",
};

const BRAVURA_URL =
  "https://cdn.jsdelivr.net/npm/@vexflow-fonts/bravura/bravura.woff2";

// ---------------------------------------------------------------------------
// Score data
// ---------------------------------------------------------------------------
const notesDurations = {
  quarterUp: 1,
  halfUp: 2,
  restQuarter: 1,
  restHalf: 2,
} as const;

type NoteDurationKey = keyof typeof notesDurations;
type NoteItem = NoteDurationKey | { beam: number };

const N1: NoteItem[] = ["quarterUp", "quarterUp", "halfUp"];
const N2: NoteItem[] = ["restHalf", { beam: 2 }, "quarterUp"];
const N3: NoteItem[] = ["restQuarter", "quarterUp", "restQuarter", "quarterUp"];

const measureDefs = [N1, N2, N3];

const BPM = 80;
const BEAT_TIME = 60 / BPM; // seconds per beat

/** Flat array of durations (seconds) for every note/sub-beat */
const flatTimings: number[] = measureDefs.flatMap((measure) =>
  measure.flatMap((item) => {
    if (typeof item === "string") return [notesDurations[item] * BEAT_TIME];
    const sub = BEAT_TIME / item.beam;
    return Array.from({ length: item.beam }, () => sub);
  }),
);

// ---------------------------------------------------------------------------
// Metronome factory (unchanged from original)
// ---------------------------------------------------------------------------
function createMetronome(bpm: number, getAudioCtx: () => AudioContext) {
  let nextClickTime = 0;
  let schedulerTimer: number | null = null;

  const SCHEDULE_AHEAD = 0.1;
  const INTERVAL_MS = 25;

  const scheduleClick = (time: number) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.5, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    osc.start(time);
    osc.stop(time + 0.07);
  };

  const scheduler = () => {
    const ctx = getAudioCtx();
    const interval = 60 / bpm;
    if (nextClickTime < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleClick(nextClickTime);
      nextClickTime += interval;
    }
  };

  return {
    start(startAt?: number) {
      if (schedulerTimer) return;
      nextClickTime = startAt ?? getAudioCtx().currentTime;
      scheduler();
      schedulerTimer = window.setInterval(scheduler, INTERVAL_MS);
    },
    stop() {
      if (!schedulerTimer) return;
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    },
  };
}

// ---------------------------------------------------------------------------
// Canvas renderer
// ---------------------------------------------------------------------------

interface DrawState {
  /** x-positions of every note (for playhead interpolation) */
  notePositions: number[];
  /** x where the playhead rests at start */
  playheadX: number;
  canvasWidth: number;
  canvasHeight: number;
}

function buildScore(
  canvas: HTMLCanvasElement,
  ctx2d: CanvasRenderingContext2D,
  sz: number, // "base" size — same semantic as original
  playheadFraction = 0.12, // where the playhead sits as fraction of width
): DrawState {
  const W = canvas.width;
  const H = canvas.height;
  const sm = sz * 0.55; // glyph font size (matches original `small`)
  const sp = sm * 0.25; // spacing unit

  ctx2d.clearRect(0, 0, W, H);
  ctx2d.fillStyle = "#fff";
  ctx2d.fillRect(0, 0, W, H);

  const midY = H / 2; // staff line y
  const glyphBase = midY + sm * 0.28; // approximate baseline for SMuFL glyphs

  // staff line
  ctx2d.strokeStyle = "#111";
  ctx2d.lineWidth = 1.5;
  ctx2d.beginPath();
  ctx2d.moveTo(0, midY);
  ctx2d.lineTo(W, midY);
  ctx2d.stroke();

  // ── helpers ──────────────────────────────────────────────────────────────
  const font = (size: number) => `${size}px Bravura`;

  const drawGlyph = (g: string, x: number, size: number) => {
    ctx2d.font = font(size);
    ctx2d.fillStyle = "#111";
    ctx2d.fillText(g, x, glyphBase);
  };

  const measureGlyph = (g: string, size: number): number => {
    ctx2d.font = font(size);
    return ctx2d.measureText(g).width;
  };

  // ── time signature ────────────────────────────────────────────────────────
  let cursorX = sp * 2;

  const tsW = measureGlyph(G.timeSig4, sm);
  drawGlyph(G.timeSig4, cursorX, sm * 0.9);
  // draw "4" twice, vertically stacked — canvas doesn't do flex-col,
  // so we just draw them at different y offsets
  ctx2d.font = font(sm * 0.9);
  ctx2d.fillStyle = "#111";
  ctx2d.fillText(G.timeSig4, cursorX, midY - sm * 0.05);
  ctx2d.fillText(G.timeSig4, cursorX, midY + sm * 0.55);
  cursorX += tsW + sp * 2;

  // ── playhead position ─────────────────────────────────────────────────────
  const playheadX = cursorX;

  // draw playhead indicator (green triangle + line)
  const drawPlayhead = (x: number) => {
    ctx2d.fillStyle = "#22c55e";
    ctx2d.strokeStyle = "#22c55e";
    ctx2d.lineWidth = 2;

    // triangle
    const triH = sp * 1.4;
    const triW = sp * 0.9;
    ctx2d.beginPath();
    ctx2d.moveTo(x, midY - sm * 1.2 - triH);
    ctx2d.lineTo(x - triW / 2, midY - sm * 1.2);
    ctx2d.lineTo(x + triW / 2, midY - sm * 1.2);
    ctx2d.closePath();
    ctx2d.fill();

    // stem
    ctx2d.beginPath();
    ctx2d.moveTo(x, midY - sm * 1.2);
    ctx2d.lineTo(x, midY + sm * 0.8);
    ctx2d.stroke();
  };

  drawPlayhead(playheadX);

  // ── opening barline ───────────────────────────────────────────────────────
  drawGlyph(G.barline, cursorX, sm);
  cursorX += measureGlyph(G.barline, sm) + sp;

  // ── measures ──────────────────────────────────────────────────────────────
  const notePositions: number[] = [];

  const NOTE_GAP_WIDE = sp * 4;
  const NOTE_GAP_NARROW = sp * 2.5;

  for (const measure of measureDefs) {
    let first = true;

    for (const item of measure) {
      if (first) {
        cursorX += sp;
        first = false;
      }

      if (typeof item === "string") {
        const glyph = G[item];
        const isWide = item === "halfUp" || item === "restHalf";
        const noteX = cursorX;

        notePositions.push(noteX + measureGlyph(glyph, sm) / 2);

        drawGlyph(glyph, noteX, sm);
        cursorX +=
          measureGlyph(glyph, sm) + (isWide ? NOTE_GAP_WIDE : NOTE_GAP_NARROW);
      } else {
        // beamed group (eighth notes)
        const count = item.beam;
        const spacing = sp * 2.6;
        const stemOff = sp * 1.05;
        const noteSize = sm;
        const stemH = sp * 3.5;
        const beamThick = sp * 0.52;

        // beam bar
        const x0 = cursorX + sp * 0.3 + stemOff;
        const x1 = cursorX + sp * 0.3 + (count - 1) * spacing + stemOff;
        ctx2d.fillStyle = "#111";
        ctx2d.fillRect(
          x0 - 0.5,
          midY - stemH - beamThick,
          x1 - x0 + 1,
          beamThick,
        );

        for (let n = 0; n < count; n++) {
          const nx = cursorX + sp * 0.3 + n * spacing;
          const sx = nx + stemOff;

          // stem
          ctx2d.strokeStyle = "#111";
          ctx2d.lineWidth = sp * 0.13;
          ctx2d.beginPath();
          ctx2d.moveTo(sx, midY + sm * 0.18);
          ctx2d.lineTo(sx, midY - stemH);
          ctx2d.stroke();

          // notehead
          ctx2d.font = font(noteSize);
          ctx2d.fillStyle = "#111";
          ctx2d.fillText(G.noteheadBlack, nx, glyphBase);

          notePositions.push(nx + measureGlyph(G.noteheadBlack, noteSize) / 2);
        }

        cursorX +=
          sp * 0.3 +
          (count - 1) * spacing +
          stemOff +
          sp * 0.6 +
          NOTE_GAP_NARROW;
      }
    }

    // barline
    drawGlyph(G.barline, cursorX, sm);
    cursorX += measureGlyph(G.barline, sm) + sp;
  }

  return {
    notePositions,
    playheadX,
    canvasWidth: W,
    canvasHeight: H,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MusicLine = forwardRef((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const metroRef = useRef<ReturnType<typeof createMetronome> | null>(null);
  const drawStateRef = useRef<DrawState | null>(null);
  const fontLoadedRef = useRef(false);

  const getAudioCtx = (): AudioContext => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  };

  // Determine canvas size from window
  const getSize = () => ({
    w: Math.min(window.innerWidth - 32, 900),
    h: window.innerWidth < 640 ? 110 : 160,
    sz: window.innerWidth < 640 ? 64 : 96,
  });

  // Draw / redraw the static score
  const redraw = (offsetX = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || !fontLoadedRef.current) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const { sz } = getSize();

    // translate for scroll
    ctx2d.save();
    ctx2d.translate(-offsetX, 0);
    const state = buildScore(canvas, ctx2d, sz);
    ctx2d.restore();
    drawStateRef.current = state;
  };

  // Load font then draw
  useEffect(() => {
    const face = new FontFace("Bravura", `url(${BRAVURA_URL})`);
    face.load().then((f) => {
      document.fonts.add(f);
      fontLoadedRef.current = true;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const { w, h } = getSize();
      canvas.width = w;
      canvas.height = h;
      redraw();
    });

    metroRef.current = createMetronome(BPM, getAudioCtx);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      metroRef.current?.stop();
    };
  }, []);

  // Resize handler
  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !fontLoadedRef.current) return;
      const { w, h } = getSize();
      canvas.width = w;
      canvas.height = h;
      redraw();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── animation ─────────────────────────────────────────────────────────────
  const handleStart = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const audioCtx = getAudioCtx();
    const startTime = audioCtx.currentTime;

    // make sure score is drawn fresh so drawStateRef is populated
    redraw();
    const state = drawStateRef.current;
    if (!state) return;

    const { notePositions, playheadX } = state;

    // relative positions: how far each note is from the playhead x
    const relPos = notePositions.map((p) => p - playheadX);

    let seg = 0;
    let segStartTime = startTime;
    let segStartX = relPos[0];
    let speed =
      relPos.length > 1 ? (relPos[1] - relPos[0]) / flatTimings[0] : 0;

    metroRef.current?.start(startTime);

    const canvas = canvasRef.current!;
    const ctx2d = canvas.getContext("2d")!;
    const { sz } = getSize();
    const sm = sz * 0.55;
    const sp = sm * 0.25;

    const loop = () => {
      const now = audioCtx.currentTime;
      let elapsed = now - segStartTime;

      // advance segments
      while (seg < flatTimings.length - 1 && elapsed >= flatTimings[seg]) {
        segStartX += relPos[seg + 1] - relPos[seg];
        segStartTime += flatTimings[seg];
        seg++;
        speed =
          seg < flatTimings.length - 1
            ? (relPos[seg + 1] - relPos[seg]) / flatTimings[seg]
            : 0;
        elapsed = now - segStartTime;
      }

      const scrollX = segStartX + elapsed * speed;

      // redraw score translated
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      ctx2d.save();
      ctx2d.translate(-scrollX, 0);
      buildScore(canvas, ctx2d, sz);
      ctx2d.restore();

      // draw playhead on top (fixed)
      const midY = canvas.height / 2;
      const triH = sp * 1.4;
      const triW = sp * 0.9;
      const x = playheadX;

      ctx2d.fillStyle = "#22c55e";
      ctx2d.strokeStyle = "#22c55e";
      ctx2d.lineWidth = 2;
      ctx2d.beginPath();
      ctx2d.moveTo(x, midY - sm * 1.2 - triH);
      ctx2d.lineTo(x - triW / 2, midY - sm * 1.2);
      ctx2d.lineTo(x + triW / 2, midY - sm * 1.2);
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.beginPath();
      ctx2d.moveTo(x, midY - sm * 1.2);
      ctx2d.lineTo(x, midY + sm * 0.8);
      ctx2d.stroke();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  useImperativeHandle(ref, () => ({ handleStart }));

  return (
    <canvas ref={canvasRef} style={{ display: "block", background: "#fff" }} />
  );
});

MusicLine.displayName = "MusicLine";
export default MusicLine;
