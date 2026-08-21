"use client";

import { useMemo } from "react";
import { useCanvasScene } from "./useCanvasScene";

const COUNT = 55;

/** Generador con semilla: el reparto es siempre el mismo, no baila entre renders. */
const seededRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/**
 * Motas de polvo suspendidas sobre la foto de fondo, con deriva lentísima y un
 * parpadeo suave. No se ve, se nota. Blanco puro, sin color: así no compite ni
 * con la foto ni con los acentos de las categorías.
 */
export default function DustLayer() {
  const motes = useMemo(() => {
    const rand = seededRandom(6180339);
    return Array.from({ length: COUNT }, () => ({
      x: rand(),
      y: rand(),
      radius: 0.6 + rand() * 1.6,
      opacity: 0.15 + rand() * 0.4,
      driftX: (rand() - 0.5) * 0.02,
      driftY: -0.006 - rand() * 0.018,
      // Cada mota parpadea a su ritmo y con su desfase: nunca van a la vez.
      blinkSpeed: 0.3 + rand() * 0.9,
      blinkPhase: rand() * 6.28,
    }));
  }, []);

  const canvasRef = useCanvasScene(({ ctx, width, height, time }) => {
    for (const mote of motes) {
      // Envuelve con módulo: la mota que se sale reaparece por el otro lado.
      const x = (((mote.x + mote.driftX * time) % 1) + 1) % 1;
      const y = (((mote.y + mote.driftY * time) % 1) + 1) % 1;
      const blink = 0.55 + 0.45 * Math.sin(time * mote.blinkSpeed + mote.blinkPhase);

      ctx.fillStyle = `rgba(255, 255, 255, ${mote.opacity * blink})`;
      ctx.beginPath();
      ctx.arc(x * width, y * height, mote.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
