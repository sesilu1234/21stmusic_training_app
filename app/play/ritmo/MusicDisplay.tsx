"use client";

import React, { useEffect, useState } from "react";

// Complete SMuFL glyphs — notes already include stems
const G = {
  quarterUp: "\uE1D5", // quarter note, stem up
  halfUp: "\uE1D3", // half note, stem up
  restQuarter: "\uE4E5", // quarter rest
  restHalf: "\uE4E4", // half rest
  timeSig4: "\uE084", // "4" digit for time sig
  barline: "\uE030", // single barline
  eighthUp: "\uE1D7",
};

const BRAVURA =
  "https://cdn.jsdelivr.net/npm/@vexflow-fonts/bravura/bravura.woff2";
const SZ = 96;

function Glyph({
  g,
  className,
  style,
}: {
  g: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`inline-block font-['Bravura'] leading-[0.5] text-[#111] ${className}`}
      style={{ fontSize: SZ, ...style }}
    >
      {g}
    </span>
  );
}

function TimeSig44() {
  return (
    <div className="flex flex-col">
      <Glyph g={G.timeSig4} style={{ fontSize: SZ * 0.55 }} />
      <Glyph g={G.timeSig4} style={{ fontSize: SZ * 0.55 }} />
    </div>
  );
}
function Measure({ notes }: { notes: string[] }) {
  return (
    <>
      {notes.map((g, i) => {
        // Logic to check if the glyph is a rest or barline

        return (
          <Glyph
            key={i}
            g={g}
            className={`ml-[18] mr-[48] ${g === G.restHalf ? "translate-y-1/8" : ""} ${g === G.restQuarter ? "translate-y-0" : ""}`}
            style={{ fontSize: SZ * 0.55 }}
          />
        );
      })}
    </>
  );
}

const M1 = [G.quarterUp, G.quarterUp, G.halfUp];
const M2 = [G.restHalf, G.eighthUp, G.eighthUp, G.quarterUp];

const M3 = [G.restQuarter, G.quarterUp, G.restQuarter, G.quarterUp];

const measures = [M1, M2, M3];

export default function MusicLine() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const font = new FontFace("Bravura", `url(${BRAVURA})`);
    font.load().then((f) => {
      document.fonts.add(f);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  return (
    <div className="flex items-center justify-start w-fit p-12 px-8 bg-white select-none">
      <TimeSig44 />
      <Glyph
        g={G.barline}
        className="ml-4 mr-[0px] translate-y-6.5"
        style={{ fontSize: SZ * 0.55 }}
      />
      <div className="flex overflow-hidden min-h-32">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-0px)` }} // 48 * 4px (Tailwind spacing)
        >
          {measures.map((m, i) => (
            <div key={i} className="relative flex items-center">
              <hr className="absolute w-full border-t-[2.0px] border-black" />
              <Measure notes={m} />
              <Glyph
                g={G.barline}
                className=" translate-y-6.5"
                style={{ fontSize: SZ * 0.55 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
