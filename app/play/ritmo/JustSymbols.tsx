"use client";

import React, { useEffect, useRef } from "react";
import { Glyph, Renderer } from "vexflow";

const JustSymbols = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(400, 100);
    const context = renderer.getContext();

    Glyph.renderGlyph(context, 20, 60, 40, "v41"); // timeSig4
    Glyph.renderGlyph(context, 80, 60, 40, "v4b"); // noteheadBlack
  }, []);

  return <div ref={containerRef} />;
};

export default JustSymbols;
