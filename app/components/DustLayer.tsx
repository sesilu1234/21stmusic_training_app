"use client";

import { useState } from "react";
import { useCanvasScene } from "./useCanvasScene";

const COUNT = 55;

/**
 * Motas de polvo suspendidas sobre la foto de fondo, con deriva lentísima y un
 * parpadeo suave. No se ve, se nota. Blanco puro, sin color: así no compite ni
 * con la foto ni con los acentos de las categorías.
 *
 * El reparto se sortea en cada montaje. Antes salía de una semilla fija, y como
 * el reloj de la escena también arranca en cero, la animación era exactamente
 * la misma película en cada carga y en cada navegación entre pantallas: las
 * mismas motas, en el mismo sitio, parpadeando igual. Se acababa notando.
 *
 * Va en `useState` y no en `useMemo` porque lo que hace falta aquí es
 * "calcúlalo una vez y no lo toques nunca más": React se reserva el derecho de
 * tirar un valor memoizado y recalcularlo, y eso daría un salto en pantalla.
 * Los números no llegan nunca al HTML — solo se pintan en el lienzo desde un
 * efecto — así que sortearlos no descuadra la hidratación.
 */
export default function DustLayer() {
  const [motes] = useState(() =>
    Array.from({ length: COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: 0.6 + Math.random() * 1.6,
      opacity: 0.15 + Math.random() * 0.4,
      driftX: (Math.random() - 0.5) * 0.02,
      driftY: -0.006 - Math.random() * 0.018,
      // Cada mota parpadea a su ritmo y con su desfase: nunca van a la vez.
      blinkSpeed: 0.3 + Math.random() * 0.9,
      blinkPhase: Math.random() * 6.28,
    })),
  );

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
