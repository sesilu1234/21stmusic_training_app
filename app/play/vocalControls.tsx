"use client";

import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from "lucide-react";

/**
 * Los cuatro controles que comparten Vocalizaciones y Rockschool.
 *
 * Las dos pantallas son la misma máquina con distintos ejercicios, así que
 * tener el transporte en dos sitios solo servía para que se fueran separando.
 */

/** Una etiqueta pequeña encima de su control. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
        {label}
      </p>
      {children}
    </div>
  );
}

/** Menos / valor / más. Lo comparten todos los ajustes numéricos. */
export function Stepper({
  value,
  onDown,
  onUp,
  downLabel,
  upLabel,
  icons = "signs",
}: {
  value: string;
  onDown: () => void;
  onUp: () => void;
  downLabel: string;
  upLabel: string;
  icons?: "signs" | "arrows";
}) {
  const Down = icons === "arrows" ? ChevronLeft : Minus;
  const Up = icons === "arrows" ? ChevronRight : Plus;

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-0.5">
      <button
        type="button"
        onClick={onDown}
        aria-label={downLabel}
        className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white active:scale-90"
      >
        <Down size={13} />
      </button>
      <span className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/70">
        {value}
      </span>
      <button
        type="button"
        onClick={onUp}
        aria-label={upLabel}
        className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white active:scale-90"
      >
        <Up size={13} />
      </button>
    </div>
  );
}

/**
 * Play y volver al principio.
 *
 * El botón grande cambia de material según el estado: disco blanco macizo
 * cuando invita a pulsarlo y cristal con un halo latiendo mientras suena. Así
 * se sabe si el ejercicio está en marcha sin tener que mirar la barra.
 *
 * Al pasar por encima el disco crece, se le enciende un halo y se le abre un
 * anillo alrededor. Son tres cosas a la vez a propósito: es el único botón de
 * la pantalla que hay que pulsar sí o sí, y tiene que pedirlo.
 */
export function Transport({
  playing,
  onToggle,
  onReset,
  canReset,
}: {
  playing: boolean;
  onToggle: () => void;
  onReset: () => void;
  canReset: boolean;
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onReset}
        disabled={!canReset}
        aria-label="Volver al principio"
        className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/45 backdrop-blur transition hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-90 disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:bg-white/[0.03] disabled:hover:text-white/45"
      >
        <RotateCcw size={13} />
      </button>

      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? "Pausa" : "Empezar"}
        className="group relative grid h-12 w-12 place-items-center rounded-full outline-none transition-transform duration-200 ease-out hover:scale-[1.08] active:scale-90"
      >
        {/* Halo: late mientras suena; parado, se enciende al pasar por encima. */}
        <span
          aria-hidden
          className={`absolute -inset-2 rounded-full blur-md transition duration-300 ${
            playing
              ? "animate-pulse bg-emerald-300/30"
              : "bg-white/25 opacity-0 group-hover:opacity-100"
          }`}
        />

        {/* Anillo que se abre hacia fuera al pasar por encima. */}
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full border transition-all duration-300 ease-out group-hover:-inset-[5px] ${
            playing
              ? "border-emerald-300/40 group-hover:border-emerald-300/70"
              : "border-white/0 group-hover:border-white/45"
          }`}
        />

        <span
          aria-hidden
          className={`absolute inset-0 rounded-full transition duration-200 ${
            playing
              ? "bg-slate-950/70 ring-1 ring-inset ring-white/30 group-hover:bg-slate-950/85"
              : "bg-gradient-to-b from-white to-slate-300 shadow-[0_6px_18px_-4px_rgba(255,255,255,0.45)] group-hover:from-white group-hover:to-white group-hover:shadow-[0_10px_26px_-6px_rgba(255,255,255,0.7)]"
          }`}
        />

        <span
          className={`relative transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-95 ${
            playing ? "text-white" : "text-slate-950"
          }`}
        >
          {playing ? (
            <Pause size={17} fill="currentColor" />
          ) : (
            <Play size={17} fill="currentColor" className="ml-0.5" />
          )}
        </span>
      </button>
    </div>
  );
}

/**
 * Qué significa cada color del teclado.
 *
 * Antes eran tres: tónica, "la toca el piano" y "la cantas tú". Sobraba una,
 * porque cantar se cantan todas — que el piano la doble o no es cosa del modo
 * de acompañamiento, no del teclado. Quedan las dos que de verdad hay que
 * mirar: dónde está la tónica y qué nota va sonando.
 */
export function Legend() {
  return (
    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/30">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Tónica
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> Nota
      </span>
    </div>
  );
}
