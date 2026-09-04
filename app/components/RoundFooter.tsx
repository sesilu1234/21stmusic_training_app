"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAbandono } from "./useAbandono";

/**
 * Pie de partida de los modos que van pregunta a pregunta: las casillas
 * numeradas del progreso y las dos flechas para moverse por ellas.
 *
 * ES EL PIE DE SIEMPRE, el de los modos primeros (Armaduras, Tríadas,
 * Séptimas, Modos griegos, Diapasón, Intervalos), que tienen esta misma
 * botonera escrita a mano dentro de cada página. Los once modos nuevos
 * llevaban otro —una fila de puntitos finos con el marcador debajo— y se ha
 * cambiado por este para que toda la app se navegue igual. Los modos viejos
 * NO usan este componente: siguen con su copia dentro de la página, así que
 * si algún día se toca el aspecto hay que tocarlo en los dos sitios (o, mejor,
 * pasar los viejos a usar esto).
 *
 * Volver atrás sirve para lo que sirve: verla otra vez y comparar lo que
 * contestaste con lo que era. Por eso solo se puede ir a lo ya respondido,
 * nunca adelantarse: la pregunta en la que va la partida es la última a la que
 * se llega.
 *
 * OJO, que no se ve mirando lo que pinta: aquí dentro también se avisa de las
 * partidas que se dejan a medias (`useAbandono`). Está aquí y no en cada juego
 * porque este pie recibe ya lo único que hace falta —qué se ha contestado y si
 * la partida sigue viva— y lo montan los once modos que van pregunta a
 * pregunta: once sitios donde poner la misma línea y donde se puede olvidar.
 * Los modos que no usan este pie llaman al hook ellos mismos.
 */

/** Un color por categoría, igual que en el menú. Marca la casilla en la que vas. */
const ACCENTS = {
  amber: "border-amber-400 bg-white/20 shadow-[0_0_10px_rgba(251,191,36,0.4)]",
  violet: "border-violet-400 bg-white/20 shadow-[0_0_10px_rgba(167,139,250,0.4)]",
  emerald: "border-emerald-400 bg-white/20 shadow-[0_0_10px_rgba(52,211,153,0.4)]",
} as const;

export default function RoundFooter({
  step,
  total,
  liveStep,
  results,
  onGoTo,
  accent = "violet",
}: {
  /** La pregunta que se está viendo. */
  step: number;
  total: number;
  /**
   * La pregunta en la que va la partida. Es hasta donde se puede navegar; con
   * -1 ya están todas contestadas.
   */
  liveStep: number;
  /** Una por pregunta: true/false si está contestada, null si no. */
  results: (boolean | null)[];
  /**
   * No se pinta: el pie de siempre no lleva marcador, que ya está el de la
   * pantalla de fin de partida. Se mantiene en los props para no tener que
   * tocar los once modos que lo pasan.
   */
  correctCount?: number;
  /**
   * Igual que el anterior: este pie no saca el botón de "seguir jugando"
   * porque desde las casillas se vuelve a la pregunta en juego de un clic.
   */
  reviewing?: boolean;
  onGoTo: (index: number) => void;
  accent?: keyof typeof ACCENTS;
}) {
  const lastReachable = liveStep === -1 ? total - 1 : liveStep;

  // `liveStep === -1` es "ya no queda ninguna por contestar", o sea partida
  // terminada: de esa se encarga GameOverModal y aquí no se avisa de nada.
  useAbandono(results, liveStep === -1);

  const canGo = (index: number) =>
    index >= 0 && index <= lastReachable && index !== step;

  return (
    <footer className="w-full pb-4 pt-2">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onGoTo(step - 1)}
          disabled={!canGo(step - 1)}
          aria-label="Pregunta anterior"
          className={`flex-shrink-0 rounded-full border border-white/10 bg-white/5 p-3 text-white transition-all ${
            canGo(step - 1) ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex max-w-[240px] flex-wrap justify-center gap-1 rounded-2xl border border-white/5 bg-black/20 p-2 md:max-w-none">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onGoTo(index)}
              disabled={!canGo(index)}
              aria-label={`Pregunta ${index + 1}`}
              aria-current={index === step}
              className={`flex h-5 w-5 items-center justify-center rounded-md border text-[7px] font-black transition-all disabled:cursor-default md:h-6 md:w-6 ${
                result === true
                  ? "border-green-400 bg-green-500 text-white"
                  : result === false
                    ? "border-red-400 bg-red-500 text-white"
                    : index === step
                      ? `scale-110 text-white ${ACCENTS[accent]}`
                      : "border-white/5 text-white/5"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onGoTo(step + 1)}
          disabled={!canGo(step + 1)}
          aria-label="Pregunta siguiente"
          className={`flex-shrink-0 rounded-full bg-amber-500 p-3 text-black shadow-lg transition-all ${
            canGo(step + 1) ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </footer>
  );
}
