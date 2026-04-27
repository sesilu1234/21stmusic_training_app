"use client";

import React, { useEffect, useRef, useState } from "react";

const BRAVURA_URL =
  "https://cdn.jsdelivr.net/npm/@vexflow-fonts/bravura/bravura.woff2";

// Simplified Glyphs
const G = {
  quarter: "\uE1D5",
  half: "\uE1D3",
  barline: "\uE030",
  time4: "\uE084",
};

// A "Full Score" is just a flat list of what to draw
const MY_SCORE = [
  G.time4,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.time4,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.time4,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.time4,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.time4,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
  G.quarter,
  G.quarter,
  G.half,
  G.barline,
];

export default function SimpleMovingScore() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const startTimeRef = useRef<number>(0);

  const SPEED = 41; // px per second
  const HEIGHT = 120;

  // 1. Load Font
  useEffect(() => {
    const font = new FontFace("Bravura", `url(${BRAVURA_URL})`);
    font.load().then((f) => {
      document.fonts.add(f);
      setFontLoaded(true);
    });
  }, []);

  // 2. The Loop
  useEffect(() => {
    if (!fontLoaded) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    // Handle Sharpness (Retina Fix)
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = HEIGHT * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${HEIGHT}px`;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", resize);
    resize();

    const render = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const elapsed = (time - startTimeRef.current) / 1000;
      const scrollX = elapsed * SPEED;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw everything relative to the scroll
      ctx.save();
      ctx.translate(-scrollX + 50, 0); // +50 starts it slightly off-edge

      const midY = HEIGHT / 2;

      // Draw Staff line
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(2000, midY); // Long staff
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw Score
      ctx.font = "60px Bravura";
      ctx.fillStyle = "#111";

      let cursorX = 0;
      MY_SCORE.forEach((glyph) => {
        ctx.fillText(glyph, cursorX, midY + 15);
        cursorX += ctx.measureText(glyph).width + 30; // glyph width + spacing
      });

      ctx.restore();

      // Draw Static Playhead (Fixed in place)
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(50, 20, 2, HEIGHT - 40);

      requestAnimationFrame(render);
    };

    const raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [fontLoaded]);

  return (
    <div style={{ background: "transparent", width: "100%" }}>
      {!fontLoaded ? null : <canvas ref={canvasRef} />}
    </div>
  );
}
