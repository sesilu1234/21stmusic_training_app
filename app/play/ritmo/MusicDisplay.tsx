"use client";

import React, { useEffect, useState, useRef } from "react";

const G = {
  quarterUp: "\uE1D5",
  halfUp: "\uE1D3",
  restQuarter: "\uE4E5",
  restHalf: "\uE4E4",
  timeSig4: "\uE084",
  barline: "\uE030",
  noteheadBlack: "\uE0A4", // ← notehead only, no stem/flag
};

const BRAVURA =
  "https://cdn.jsdelivr.net/npm/@vexflow-fonts/bravura/bravura.woff2";

// A note item is either a plain glyph string or a beamed group spec
type NoteItem = string | { beam: number };

function Glyph({
  g,
  sz,
  className,
  style,
}: {
  g: string;
  sz: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`inline-block font-['Bravura'] leading-[0.5] text-[#111] ${className}`}
      style={{ fontSize: sz, ...style }}
    >
      {g}
    </span>
  );
}

/**
 * Renders N eighth notes beamed together.
 *
 * Key insight: the SVG height is 2×(topPad + stemH), so the vertical
 * midpoint (where the notehead sits) aligns with the staff line when
 * the parent uses `items-center`.
 */
function BeamedGroup({ count = 2, sz }: { count: number; sz: number }) {
  const small = sz * 0.55;
  const sp = small * 0.25; // 1 staff space ≈ 25 % of font-size

  // Vertical geometry — noteY is H/2 so items-center lands it on the staff
  const topPad = sp * 0.4;
  const stemH = sp * 3.5;
  const noteY = topPad + stemH; // = H / 2
  const H = noteY * 2;

  // Beam
  const beamThickness = sp * 0.52;
  const beamY = topPad;

  // Horizontal geometry
  const stemOffset = sp * 1.05; // how far right of noteX the stem sits
  const spacing = sp * 2.6; // notehead-to-notehead gap
  const noteX = (i: number) => sp * 0.3 + i * spacing;
  const stemXi = (i: number) => noteX(i) + stemOffset;
  const W = noteX(count - 1) + stemOffset + sp * 0.6;

  return (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      {/* ── Beam (drawn first so stems render on top) ── */}
      <rect
        x={stemXi(0)}
        y={beamY}
        width={stemXi(count - 1) - stemXi(0)}
        height={beamThickness}
        fill="#111"
      />

      {Array.from({ length: count }).map((_, i) => (
        <g key={i}>
          {/* Stem */}
          <line
            x1={stemXi(i)}
            y1={noteY - sp * 0.18}
            x2={stemXi(i)}
            y2={beamY + beamThickness}
            stroke="#111"
            strokeWidth={sp * 0.13}
            strokeLinecap="square"
          />
          {/* Notehead (noteheadBlack, no flag) */}
          <text
            fontFamily="Bravura"
            fontSize={small}
            x={noteX(i)}
            y={noteY}
            fill="#111"
          >
            {G.noteheadBlack}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TimeSig44({ sz }: { sz: number }) {
  const small = sz * 0.55;
  return (
    <div className="flex flex-col">
      <Glyph g={G.timeSig4} sz={small} />
      <Glyph g={G.timeSig4} sz={small} />
    </div>
  );
}

function Measure({ notes, sz }: { notes: NoteItem[]; sz: number }) {
  const small = sz * 0.55;
  const margin = "ml-[9] mr-[24] md:ml-[18] md:mr-[48]";

  return (
    <>
      {notes.map((item, i) => {
        // ── plain glyph ──────────────────────────────────────────
        if (typeof item === "string") {
          return (
            <Glyph
              key={i}
              g={item}
              sz={small}
              className={`${margin} ${item === G.restHalf ? "translate-y-1/8" : ""}`}
            />
          );
        }
        // ── beamed group ─────────────────────────────────────────
        return (
          <span key={i} className={`inline-flex items-center ${margin}`}>
            <BeamedGroup count={item.beam} sz={sz} />
          </span>
        );
      })}
    </>
  );
}

const notesDurations = {
  quarterUp: 1,
  halfUp: 2,
  restQuarter: 1,
  restHalf: 2,
};

const N1: NoteItem[] = ["quarterUp", "quarterUp", "halfUp"];
const N2: NoteItem[] = ["restHalf", { beam: 2 }, "quarterUp"];
const N3: NoteItem[] = ["restQuarter", "quarterUp", "restQuarter", "quarterUp"];

const measureKeys = [N1, N2, N3];

const bpm = 80;
const beatTime = 60 / bpm;

const measuresTimings = measureKeys.map((measure) =>
  measure.flatMap((item) => {
    if (typeof item === "string") {
      return [notesDurations[item] * beatTime];
    }

    // beam: split ONE beat into N parts
    const sub = beatTime / item.beam;
    return Array.from({ length: item.beam }, () => sub);
  }),
);

console.log("measuresTimings", measuresTimings);

const mapNotes = (arr: NoteItem[]) =>
  arr.map((n) => (typeof n === "string" ? G[n] : n));

const measures = measureKeys.map((n) => mapNotes(n));

export default function MusicLine() {
  const [loaded, setLoaded] = useState(false);
  const [sz, setSz] = useState(96);

  useEffect(() => {
    const font = new FontFace("Bravura", `url(${BRAVURA})`);
    font.load().then((f) => {
      document.fonts.add(f);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const update = () => setSz(window.innerWidth < 640 ? 64 : 96);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const small = sz * 0.55;

  function createMetronome(bpm: number) {
    let ctx: AudioContext | null = null;
    let nextClickTime = 0;
    let schedulerTimer: number | null = null;

    const SCHEDULE_AHEAD = 0.1; // seconds to look ahead
    const INTERVAL_MS = 25; // how often the scheduler runs

    const scheduleClick = (time: number) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = 800; // lower = less harsh

      // Fade IN to avoid the pop, then fade out
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.5, time + 0.005); // 5ms attack
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06); // 55ms decay

      osc.start(time);
      osc.stop(time + 0.065);
    };

    const scheduler = () => {
      if (!ctx) return;
      const interval = 60 / bpm;
      // Schedule any clicks that fall within the lookahead window
      if (nextClickTime < ctx.currentTime + SCHEDULE_AHEAD) {
        scheduleClick(nextClickTime);
        nextClickTime += interval;
      }
    };

    return {
      start() {
        if (schedulerTimer) return;
        if (!ctx) ctx = new AudioContext();
        nextClickTime = ctx.currentTime; // start immediately
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

  const metroRef = useRef<ReturnType<typeof createMetronome> | null>(null);

  useEffect(() => {
    metroRef.current = createMetronome(120);
    return () => metroRef.current?.stop(); // cleanup on unmount
  }, []);

  if (!loaded) return null;

  return (
    <div className="flex items-center justify-center w-fit py-12 px-2 md:px-8 bg-white select-none">
      {/* Calqueta — línea verde fina al inicio */}
      {/* Calqueta con flechita arriba */}
      <button
        className="w-12 h-12 bg-green-500 cursor-pointer"
        onClick={() => metroRef.current.start()}
      >
        Start
      </button>
      ;
      <TimeSig44 sz={sz} />
      {/* First barline with calqueta on top */}
      <div className="relative flex flex-col items-center  ml-4">
        {/* Calqueta */}
        <div className="absolute inset-0 -top-18 flex flex-col items-center pointer-events-none self-stretch h-36">
          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-green-500" />
          <div className="flex-1 w-[2px] bg-green-500 rounded-b-full" />
        </div>

        <Glyph
          g={G.barline}
          sz={small}
          className={`mr-0 ${sz < 80 ? "translate-y-4" : "translate-y-6.5"}`}
        />
      </div>
      <div className="flex overflow-hidden min-h-32">
        <div className="flex transition-transform duration-300 ease-out">
          {measures.map((m, i) => (
            <div key={i} className="relative flex items-center">
              <hr className="absolute w-full border-t-[2.0px] border-black" />
              <Measure notes={m} sz={sz} />
              <Glyph
                g={G.barline}
                sz={small}
                className={sz < 80 ? "translate-y-4" : "translate-y-6.5"}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
