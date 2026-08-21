"use client";

import { useEffect, useRef } from "react";

export interface SceneContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Segundos desde que arrancó la escena. Congelado si el sistema pide menos movimiento. */
  time: number;
}

/**
 * Lienzo a pantalla completa con bucle de animación. Se encarga del tamaño
 * real en píxeles (retina), del resize y de parar el bucle cuando el usuario
 * pide menos movimiento: en ese caso pinta un solo fotograma.
 */
export function useCanvasScene(draw: (scene: SceneContext) => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);

  // Se refresca en cada render para que el bucle use siempre el último `draw`
  // sin tener que reiniciarse.
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      drawRef.current({ ctx, width, height, time: still ? 0 : (now - start) / 1000 });
      if (!still) frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    const onResize = () => {
      resize();
      if (still) render(performance.now());
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return canvasRef;
}
