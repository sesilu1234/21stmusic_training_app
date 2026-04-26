"use client";

import React, { useEffect, useState } from "react";

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

function TimeSig44({ sz }: { sz: number }) {
  const small = sz * 0.55;

  return (
    <div className="flex flex-col">
      <Glyph g={G.timeSig4} sz={small} />
      <Glyph g={G.timeSig4} sz={small} />
    </div>
  );
}

function Measure({ notes, sz }: { notes: string[]; sz: number }) {
  const small = sz * 0.55;

  return (
    <>
      {notes.map((g, i) => (
        <Glyph
          key={i}
          g={g}
          sz={small}
          className={`ml-[9] mr-[24] md:ml-[18] md:mr-[48] ${
            g === G.restHalf ? "translate-y-1/8" : ""
          }`}
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
  const [sz, setSz] = useState(96);

  useEffect(() => {
    const font = new FontFace("Bravura", `url(${BRAVURA})`);
    font.load().then((f) => {
      document.fonts.add(f);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const update = () => {
      setSz(window.innerWidth < 640 ? 64 : 96);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!loaded) return null;

  const small = sz * 0.55;

  return (
    <div className="flex items-center justify-center w-fit py-12 px-2 md:px-8 bg-white select-none scale-100">
      <TimeSig44 sz={sz} />

      <Glyph
        g={G.barline}
        sz={small}
        className={`ml-4 mr-[0px] ${sz < 80 ? "translate-y-4" : "translate-y-6.5"}`}
      />

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
