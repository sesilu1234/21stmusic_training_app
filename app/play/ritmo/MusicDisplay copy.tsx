"use client";

import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

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

const Glyph = React.forwardRef<
  HTMLSpanElement,
  {
    g: string;
    sz: number;
    className?: string;
    style?: React.CSSProperties;
  }
>(({ g, sz, className, style }, ref) => {
  return (
    <span
      ref={ref}
      className={`inline-block font-['Bravura'] leading-[0.5] text-[#111] ${className ?? ""}`}
      style={{ fontSize: sz, ...style }}
    >
      {g}
    </span>
  );
});

/**
 * Renders N eighth notes beamed together.
 *
 * Key insight: the SVG height is 2×(topPad + stemH), so the vertical
 * midpoint (where the notehead sits) aligns with the staff line when
 * the parent uses `items-center`.
 */

function BeamedGroup({
  count = 2,
  sz,
  startIndex,
  setRef,
}: {
  count: number;
  sz: number;
  startIndex: number;
  setRef: (el: HTMLSpanElement | null, i: number) => void;
}) {
  const small = sz * 0.55;
  const sp = small * 0.25;

  const topPad = sp * 0.4;
  const stemH = sp * 3.5;
  const noteY = topPad + stemH;
  const H = noteY * 2;

  const beamThickness = sp * 0.52;
  const beamY = topPad;

  const stemOffset = sp * 1.05;
  const spacing = sp * 2.6;

  const noteX = (i: number) => sp * 0.3 + i * spacing;
  const stemXi = (i: number) => noteX(i) + stemOffset;
  const W = noteX(count - 1) + stemOffset + sp * 0.6;

  return (
    <svg width={W} height={H} style={{ overflow: "visible", display: "block" }}>
      <rect
        x={stemXi(0) - 0.5}
        y={beamY}
        width={stemXi(count - 1) - stemXi(0) + 1}
        height={beamThickness}
        fill="#111"
      />

      {Array.from({ length: count }).map((_, i) => {
        const idx = startIndex + i;

        return (
          <g key={i}>
            <line
              x1={stemXi(i)}
              y1={noteY - sp * 0.18}
              x2={stemXi(i)}
              y2={beamY + beamThickness}
              stroke="#111"
              strokeWidth={sp * 0.13}
              strokeLinecap="square"
            />

            <text
              ref={(el) => setRef(el as any, idx)}
              fontFamily="Bravura"
              fontSize={small}
              x={noteX(i)}
              y={noteY}
              fill="#111"
            >
              {G.noteheadBlack}
            </text>
          </g>
        );
      })}
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

const notesDurations = {
  quarterUp: 1,
  halfUp: 2,
  restQuarter: 1,
  restHalf: 2,
} as const; // 'as const' makes the values read-only and specific

// Create a type based on the keys of the object above
type NoteDurationKey = keyof typeof notesDurations;
type NoteItem = NoteDurationKey | { beam: number };

// 2. Add a type for the result AFTER mapping (contains Unicode strings)
type MappedNoteItem = string | { beam: number };

function Measure({
  notes,
  sz,
  setRef,
  startIndex,
}: {
  notes: MappedNoteItem[];
  sz: number;
  setRef: (el: HTMLSpanElement | null, i: number) => void;
  startIndex: number;
}) {
  const small = sz * 0.55;

  const margin_1 = "mr-4 md:mr-8";
  const margin_2 = "mr-8 md:mr-16";
  const margin_1_2 = "mr-4 md:mr-8";

  let idx = startIndex;

  return (
    <>
      {notes.map((item, i) => {
        if (typeof item === "string") {
          const current = idx++;
          const isWide = item === G.restHalf || item === G.halfUp;
          return (
            <Glyph
              key={i}
              ref={(el) => setRef(el, current)}
              g={item}
              sz={small}
              className={`${isWide ? margin_2 : margin_1} ${i === 0 ? "ml-4" : ""}`}
            />
          );
        }

        const current = idx;
        idx += item.beam;

        return (
          <span key={i} className={`inline-flex items-center mr-4`}>
            <BeamedGroup
              count={item.beam}
              sz={sz}
              startIndex={current}
              setRef={setRef}
            />
          </span>
        );
      })}
    </>
  );
}
// Now, when you check (typeof item === "string"),
// TypeScript automatically knows it MUST be a NoteDurationKey.

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

// 1. Keep your existing types

// 3. Update Measure to accept the mapped strings

// 4. Update mapNotes to transform NoteItem[] -> MappedNoteItem[]
const mapNotes = (arr: NoteItem[]): MappedNoteItem[] =>
  arr.map((n) => (typeof n === "string" ? G[n] : n));

// The rest of your logic remains the same
const measures = measureKeys.map((n) => mapNotes(n));

const MusicLine = forwardRef((props, ref) => {
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

  let ctx: AudioContext | null = null;

  const getCtx = () => {
    if (!ctx) ctx = new AudioContext();
    return ctx;
  };

  function createMetronome(bpm: number) {
    let nextClickTime = 0;
    let schedulerTimer: number | null = null;

    const SCHEDULE_AHEAD = 0.1;
    const INTERVAL_MS = 25;

    const scheduleClick = (time: number) => {
      const ctx = getCtx();

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
      const ctx = getCtx();
      const interval = 60 / bpm;

      if (nextClickTime < ctx.currentTime + SCHEDULE_AHEAD) {
        scheduleClick(nextClickTime);
        nextClickTime += interval;
      }
    };

    return {
      start(startAt?: number) {
        const ctx = getCtx();

        if (schedulerTimer) return;

        nextClickTime = startAt ?? ctx.currentTime;

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
    metroRef.current = createMetronome(bpm);
    return () => metroRef.current?.stop(); // cleanup on unmount
  }, []);

  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  const setRef = (el: HTMLSpanElement | null, i: number) => {
    refs.current[i] = el;
  };
  let globalIndex = 0;

  useEffect(() => {
    console.log(refs);
  }, []);

  const handleStart = () => {
    const ctx = getCtx();
    const startTime = ctx.currentTime;

    const flatTimings = measuresTimings.flat();

    // posiciones PRECALCULADAS (clave)
    const positions = refs.current.map(
      (el) => el!.getBoundingClientRect().left,
    );

    let i = 0;

    // posición inicial relativa al playhead
    const baseLeft = playheadRef.current!.getBoundingClientRect().left;

    let segmentStartX = positions[0] - baseLeft;
    let segmentStartTime = startTime;

    playheadRef.current!.style.transform = `translateX(${segmentStartX}px)`;

    metroRef.current?.start(startTime);

    // velocidad inicial
    let speed = (positions[1] - positions[0]) / flatTimings[0];

    const loop = () => {
      const now = getCtx().currentTime;

      let elapsed = now - segmentStartTime;

      // avanzar segmentos correctamente (puede saltar varios)
      while (elapsed >= flatTimings[i] && i < flatTimings.length - 1) {
        const distance = positions[i + 1] - positions[i];

        segmentStartX += distance;
        segmentStartTime += flatTimings[i];

        i++;

        const nextDistance = positions[i + 1] - positions[i];
        speed = nextDistance / flatTimings[i];

        elapsed = now - segmentStartTime;
      }

      const movedX = segmentStartX + elapsed * speed;

      playheadRef.current!.style.transform = `translateX(${movedX}px)`;

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  };
  const playheadRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    handleStart,
  }));

  {
    /*  ///////////////////////  */
  }
  {
    /*  ///////////////////////  */
  }
  {
    /*  ///////////////////////  */
  }
  {
    /*  ///////////////////////  */
  }
  {
    /*  ///////////////////////  */
  }

  if (!loaded) return null;

  return (
    <div className="flex items-center justify-center w-fit py-12 px-2 md:px-8 bg-white select-none">
      {/* Calqueta — línea verde fina al inicio */}
      {/* Calqueta con flechita arriba */}

      <TimeSig44 sz={sz} />
      {/* First barline with calqueta on top */}
      <div className="relative flex flex-col items-center  ml-4">
        {/* Calqueta */}
        <div
          className="absolute inset-0 -top-18 flex flex-col items-center pointer-events-none self-stretch h-36 transition-none"
          ref={playheadRef}
        >
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
          {measures.map((m, i) => {
            const startIndex = globalIndex;

            const count = m.reduce((acc, item) => {
              return acc + (typeof item === "string" ? 1 : item.beam);
            }, 0);

            globalIndex += count;

            return (
              <div key={i} className="relative flex items-center">
                <hr className="absolute w-full border-t-[2.0px] border-black" />

                <Measure
                  notes={m}
                  sz={sz}
                  setRef={setRef}
                  startIndex={startIndex}
                />

                {/* barline intentionally has NO ref */}
                <Glyph
                  g={G.barline}
                  sz={small}
                  className={sz < 80 ? "translate-y-4" : "translate-y-6.5"}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default MusicLine;
