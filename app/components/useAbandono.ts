"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Avisa al servidor cuando el alumno deja una partida a medias.
 *
 * Por qué existe: hasta ahora solo se guardaba la partida que llega al final, y
 * eso sesga todo lo que se enseña. Quien va fallando recarga la página o se va,
 * esa partida no se guarda, y la media del alumno acaba siendo la media de sus
 * partidas buenas. Con esto se puede saber qué pantallas se dejan a medias.
 *
 * Cómo: `navigator.sendBeacon`. Un `fetch` lanzado mientras la página se
 * descarga se cancela casi siempre; el beacon se lo queda el navegador y lo
 * manda él, sin retrasar el cierre ni la navegación. No se puede leer la
 * respuesta, y da igual: no hay nada que leer.
 *
 * Lo que NO pilla: cerrar el portátil de golpe, quedarse sin batería o matar la
 * pestaña desde el gestor de tareas. Cogerá la gran mayoría, y sirve para ver
 * una tendencia, no para llevar la contabilidad.
 *
 * No manda nada si no se ha contestado ninguna pregunta (abrir la pantalla y
 * salir no es una partida) ni si la partida ha terminado (de esa ya se encarga
 * `GameOverModal`). Y sin sesión el servidor lo descarta.
 */

/** Los dos formatos de `results` que usan los juegos, en el mismo sitio. */
export type Resultado = boolean | "correct" | "wrong" | null;

const esAcierto = (result: Resultado) => result === true || result === "correct";

export function useAbandono(results: readonly Resultado[], terminada: boolean) {
  const pathname = usePathname();

  /**
   * Lo último que se sabe de la partida, en una ref y no en el estado.
   *
   * El aviso se manda desde un listener que se registra UNA vez: si dependiera
   * del estado, habría que volver a registrarlo en cada respuesta, y el efecto
   * de limpieza podría mandar el beacon a mitad de partida. La ref se actualiza
   * aparte, sin tocar el listener.
   */
  const estado = useRef({ contestadas: 0, aciertos: 0, terminada, pathname });

  // Se escribe en un efecto sin lista de dependencias —o sea, después de cada
  // render— y no en el cuerpo de la función: escribir una ref mientras React
  // está renderizando no está permitido. Aquí no cambia nada, porque quien la
  // lee es un listener del navegador, que siempre llega después.
  useEffect(() => {
    estado.current = {
      contestadas: results.filter((result) => result !== null).length,
      aciertos: results.filter(esAcierto).length,
      terminada,
      pathname,
    };
  });

  /** Una partida se avisa una sola vez, aunque salten los dos eventos. */
  const enviado = useRef(false);

  useEffect(() => {
    const avisar = () => {
      const { contestadas, aciertos, terminada: fin, pathname: ruta } = estado.current;
      if (enviado.current || fin || contestadas < 1) return;
      enviado.current = true;

      try {
        navigator.sendBeacon(
          "/api/abandon",
          // Blob y no un string pelado para poder ponerle el tipo: sin él, el
          // beacon sale como texto plano y `req.json()` en el servidor se
          // queja según el navegador.
          new Blob(
            [JSON.stringify({ pathname: ruta, correct: aciertos, total: contestadas })],
            { type: "application/json" },
          ),
        );
      } catch {
        // Navegador sin sendBeacon o con la llamada bloqueada. Se pierde el
        // dato y no pasa absolutamente nada.
      }
    };

    // `pagehide` cubre cerrar la pestaña, recargar y navegar fuera. En iOS no
    // siempre llega, y ahí el que salta es `visibilitychange` al irse a otra
    // app — de ahí los dos. `beforeunload` no se usa a propósito: en móvil casi
    // no dispara y además estropea la caché de atrás/adelante del navegador.
    const alOcultarse = () => {
      if (document.visibilityState === "hidden") avisar();
    };

    window.addEventListener("pagehide", avisar);
    document.addEventListener("visibilitychange", alOcultarse);

    return () => {
      window.removeEventListener("pagehide", avisar);
      document.removeEventListener("visibilitychange", alOcultarse);
      // Salir del juego navegando por dentro de la app no descarga la página,
      // así que no hay `pagehide`: el aviso se manda al desmontarse.
      avisar();
    };
  }, []);
}
