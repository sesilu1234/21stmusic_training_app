"use client";

import { ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { useAbandono } from "./useAbandono";

/**
 * Pie de partida de los modos que van pregunta a pregunta: los puntitos del
 * progreso, el marcador y —lo importante— poder volver a una pregunta ya
 * contestada.
 *
 * Volver atrás sirve para lo que sirve: oírla otra vez y ver qué contestaste y
 * qué era. Por eso solo se puede ir a lo ya respondido, nunca adelantarse: la
 * pregunta en la que va la partida es la última a la que se llega.
 *
 * OJO, que no se ve mirando lo que pinta: aquí dentro también se avisa de las
 * partidas que se dejan a medias (`useAbandono`). Está aquí y no en cada juego
 * porque este pie recibe ya lo único que hace falta —qué se ha contestado y si
 * la partida sigue viva— y lo montan los once modos que van pregunta a
 * pregunta: once sitios donde poner la misma línea y donde se puede olvidar.
 * Los modos que no usan este pie llaman al hook ellos mismos.
 */

/** Un color por categoría, igual que en el menú. */
const ACCENTS = {
  amber: {
    dot: "bg-amber-300",
    text: "text-amber-200",
    border: "hover:border-amber-300/50",
  },
  violet: {
    dot: "bg-violet-300",
    text: "text-violet-200",
    border: "hover:border-violet-300/50",
  },
  emerald: {
    dot: "bg-emerald-300",
    text: "text-emerald-200",
    border: "hover:border-emerald-300/50",
  },
} as const;

export default function RoundFooter({
  step,
  total,
  liveStep,
  results,
  correctCount,
  reviewing,
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
  correctCount: number;
  /**
   * true solo si has ido a mirar una pregunta vieja. No se deduce de `step`
   * porque en el segundo que va desde que contestas hasta que la partida pasa
   * sola a la siguiente estarías "detrás" sin haber navegado a ningún sitio, y
   * saldría un "seguir jugando" cuando ya estás jugando.
   */
  reviewing: boolean;
  onGoTo: (index: number) => void;
  accent?: keyof typeof ACCENTS;
}) {
  const palette = ACCENTS[accent];
  const lastReachable = liveStep === -1 ? total - 1 : liveStep;

  // `liveStep === -1` es "ya no queda ninguna por contestar", o sea partida
  // terminada: de esa se encarga GameOverModal y aquí no se avisa de nada.
  useAbandono(results, liveStep === -1);

  const canGo = (index: number) =>
    index >= 0 && index <= lastReachable && index !== step;

  return (
    <footer className="pb-4">
      <div className="mb-3 flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onGoTo(step - 1)}
          disabled={!canGo(step - 1)}
          aria-label="Pregunta anterior"
          className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white/40"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="flex flex-wrap justify-center gap-1.5">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onGoTo(index)}
              disabled={!canGo(index)}
              aria-label={`Pregunta ${index + 1}`}
              aria-current={index === step}
              // El punto es diminuto, así que el botón se hace grande a base
              // de padding y lo que se ve sigue siendo el punto.
              className="group -my-1.5 px-0.5 py-1.5 disabled:cursor-default"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  index === step ? `w-5 ${palette.dot}` : "w-1.5"
                } ${
                  result === null
                    ? index === step
                      ? ""
                      : "bg-white/15"
                    : result
                      ? "bg-emerald-400"
                      : "bg-rose-400"
                } ${
                  canGo(index) ? "group-hover:h-2.5 group-hover:bg-white/60" : ""
                }`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onGoTo(step + 1)}
          disabled={!canGo(step + 1)}
          aria-label="Pregunta siguiente"
          className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-white/40"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">
          {step + 1} / {total} · {correctCount}{" "}
          {correctCount === 1 ? "acierto" : "aciertos"}
        </p>

        {reviewing && (
          <button
            type="button"
            onClick={() => onGoTo(lastReachable)}
            className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] transition ${palette.text} ${palette.border}`}
          >
            <Undo2 size={11} />
            Seguir jugando
          </button>
        )}
      </div>
    </footer>
  );
}
