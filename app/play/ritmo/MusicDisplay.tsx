"use client";
import React, { useEffect, useState, useRef, forwardRef } from "react";

const G = {
  quarterUp: "\uE1D5",
  halfUp: "\uE1D3",
  restQuarter: "\uE4E5",
  restHalf: "\uE4E4",
  timeSig4: "\uE084",
  barline: "\uE030",
  eighthUp: "\uE1D7",
};

const BRAVURA =
  "https://cdn.jsdelivr.net/npm/@vexflow-fonts/bravura/bravura.woff2";
const SZ = 96;

const Glyph = forwardRef<
  HTMLSpanElement,
  { g: string; className?: string; style?: React.CSSProperties }
>(({ g, className, style }, ref) => {
  return (
    <span
      ref={ref}
      className={`inline-block font-['Bravura'] leading-[0.5] text-[#111] ${className}`}
      style={{ fontSize: SZ, ...style }}
    >
      {g}
    </span>
  );
});
function TimeSig44() {
  return (
    <div className="flex flex-col">
      <Glyph g={G.timeSig4} style={{ fontSize: SZ * 0.55 }} />
      <Glyph g={G.timeSig4} style={{ fontSize: SZ * 0.55 }} />
    </div>
  );
}

// ← accepts refs array, one per note
function Measure({
  notes,
  refs,
}: {
  notes: string[];
  refs: React.RefObject<HTMLSpanElement>[];
}) {
  return (
    <>
      {notes.map((g, i) => (
        <Glyph
          key={i}
          ref={refs[i]}
          g={g}
          className={`ml-[18] mr-[48] ${g === G.restHalf ? "translate-y-1/8" : ""} ${g === G.restQuarter ? "translate-y-0" : ""}`}
          style={{ fontSize: SZ * 0.55 }}
        />
      ))}
    </>
  );
}

const M1 = [G.quarterUp, G.quarterUp, G.halfUp];
const M2 = [G.restHalf, G.eighthUp, G.eighthUp, G.quarterUp];
const M3 = [G.restQuarter, G.quarterUp, G.restQuarter, G.quarterUp];
const measures = [M1, M2, M3];

export default function MusicLine() {
  const [loaded, setLoaded] = useState(false);

  // flat list of refs, one per note across all measures
  const allNotes = measures.flat();
  const noteRefs = useRef(
    allNotes.map(() => React.createRef<HTMLSpanElement>()),
  );

  useEffect(() => {
    const font = new FontFace("Bravura", `url(${BRAVURA})`);
    font.load().then((f) => {
      document.fonts.add(f);
      setLoaded(true);
    });
  }, []);

  // ← log after render, once font is ready
  useEffect(() => {
    if (!loaded) return;
    noteRefs.current.forEach((ref, i) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        console.log(`note[${i}]`, {
          x: rect.left,
          y: rect.top,
          width: rect.width,
        });
      }
    });
  }, [loaded]);

  if (!loaded) return null;

  // slice refs back into per-measure chunks
  let cursor = 0;
  const measureRefs = measures.map((m) => {
    const chunk = noteRefs.current.slice(cursor, cursor + m.length);
    cursor += m.length;
    return chunk;
  });

  return (
    <div className="flex items-center justify-start w-fit p-12 px-8 bg-white select-none">
      <TimeSig44 />
      <Glyph
        g={G.barline}
        className="ml-4 mr-[0px] translate-y-6.5"
        style={{ fontSize: SZ * 0.55 }}
      />
      {measures.map((m, i) => (
        <div key={i} className="flex items-center">
          <Measure notes={m} refs={measureRefs[i]} />
          <Glyph
            g={G.barline}
            className="translate-y-6.5"
            style={{ fontSize: SZ * 0.55 }}
          />
        </div>
      ))}
    </div>
  );
}
