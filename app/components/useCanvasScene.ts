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

    /**
     * Devuelve true si ha tenido que cambiar el tamaño del lienzo.
     *
     * Asignar `canvas.width` o `canvas.height` **borra el lienzo entero**,
     * aunque el valor sea el mismo. Eso importa mucho en móvil: al hacer scroll,
     * Chrome pliega la barra de direcciones, cambia `innerHeight`, salta
     * `resize` y el fondo se quedaba en blanco hasta el siguiente fotograma. Era
     * el parpadeo de nada más empezar a deslizar.
     *
     * Con la comparación previa, el caso de la barra de direcciones sí cambia el
     * alto y hay que redimensionar; pero la ristra de `resize` repetidos que
     * dispara el navegador con el mismo tamaño ya no borra nada.
     */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      const nextWidth = Math.round(width * dpr);
      const nextHeight = Math.round(height * dpr);
      if (canvas.width === nextWidth && canvas.height === nextHeight) return false;
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };
    resize();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    let lastDraw = 0;

    /**
     * A 30 fotogramas por segundo. Son motas de polvo a la deriva: a 30 se ven
     * exactamente igual que a 60 y se le devuelve al navegador la mitad del
     * trabajo justo cuando más falta le hace, que es mientras se hace scroll.
     */
    const FRAME_MS = 1000 / 30;

    const render = (now: number) => {
      if (!still) frame = requestAnimationFrame(render);
      if (now - lastDraw < FRAME_MS) return;
      lastDraw = now;
      ctx.clearRect(0, 0, width, height);
      drawRef.current({ ctx, width, height, time: still ? 0 : (now - start) / 1000 });
    };
    frame = requestAnimationFrame(render);

    const onResize = () => {
      const resized = resize();
      // Sin movimiento solo se pinta un fotograma, así que si el redimensionado
      // lo ha borrado hay que volver a pintarlo a mano. `lastDraw` a cero para
      // que el limitador de 30 fps no se coma justo este.
      if (still && resized) {
        lastDraw = 0;
        render(performance.now());
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return canvasRef;
}
