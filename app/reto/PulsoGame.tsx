"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioContext, scheduleClick } from "@/app/components/notePlayer";
import {
  PULSO_COUNT_IN,
  PULSO_LEAD_IN,
  PULSO_MAX_ROUNDS,
  PULSO_TAIL_BEATS,
  pulsoMatches,
  pulsoPattern,
} from "@/lib/pulso";

type Phase = "countin" | "listen" | "ready" | "play" | "pass" | "over";

/** Los sonidos: el del ritmo, el del metrónomo y el de tu golpe, distintos para no liarse. */
const RHYTHM = { freq: 760, gain: 1, decay: 0.09 };
const COUNT = { freq: 1250, gain: 0.55, decay: 0.04 };
const COUNT_ACCENT = { freq: 1650, gain: 0.65, decay: 0.04 };
const SOFT = { freq: 1250, gain: 0.16, decay: 0.03 };
const TAP = { freq: 520, gain: 0.7, decay: 0.05 };

const LABEL: Record<Phase, string> = {
  countin: "Escucha…",
  listen: "Escucha el ritmo",
  ready: "Prepárate…",
  play: "¡Ahora tú!",
  pass: "¡Bien!",
  over: "Fin",
};

/**
 * Una partida de Pulso. Empieza sola al montarse, como `EcoGame`, y avisa con
 * `onCheckpoint` al superar cada ronda y con `onEnd` al fallar.
 *
 * Todo va en el reloj del audio: los clics se programan con `ctx.currentTime`
 * y los golpes del alumno se apuntan con la hora de ese mismo reloj, así que
 * lo que se compara está medido con la misma regla que lo que suena.
 */
export default function PulsoGame({
  seedKey,
  onCheckpoint,
  onEnd,
}: {
  seedKey: string;
  onCheckpoint: (rounds: number[][]) => void;
  onEnd: (rounds: number[][], score: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>("countin");
  const [round, setRound] = useState(0);
  /** Qué pulso del compás está sonando (0-3), o -1. */
  const [beat, setBeat] = useState(-1);
  const [flash, setFlash] = useState(false);

  const roundsRef = useRef<number[][]>([]);
  const tapsRef = useRef<number[]>([]);
  const windowRef = useRef<{ from: number; to: number } | null>(null);
  const frameRef = useRef<number>(0);
  const flashRef = useRef<number | null>(null);
  const callbacks = useRef({ onCheckpoint, onEnd });
  /** La ronda siguiente se lanza desde dentro de la anterior: por eso va en una ref. */
  const nextRoundRef = useRef<(n: number, pause: number) => void>(() => undefined);
  useEffect(() => {
    callbacks.current = { onCheckpoint, onEnd };
  }, [onCheckpoint, onEnd]);

  const playRound = useCallback(
    (n: number, pause = 0) => {
      const ctx = audioContext();
      const pattern = pulsoPattern(seedKey, n);
      const b = pattern.beat;
      const beats = pattern.measures * 4;

      // Entrada · ritmo · entrada · tu turno. El metrónomo sigue flojito por
      // debajo del ritmo y de tu turno: ayuda a no perder el pulso.
      const t0 = ctx.currentTime + PULSO_LEAD_IN + pause;
      const listenAt = t0 + PULSO_COUNT_IN * b;
      const readyAt = listenAt + pattern.seconds;
      const playAt = readyAt + PULSO_COUNT_IN * b;
      const endAt = playAt + pattern.seconds + PULSO_TAIL_BEATS * b;

      for (let k = 0; k < PULSO_COUNT_IN; k++) {
        scheduleClick(t0 + k * b, k === 0 ? COUNT_ACCENT : COUNT);
        scheduleClick(readyAt + k * b, k === 0 ? COUNT_ACCENT : COUNT);
      }
      for (let k = 0; k < beats; k++) {
        scheduleClick(listenAt + k * b, SOFT);
        scheduleClick(playAt + k * b, SOFT);
      }
      pattern.onsets.forEach((onset) => scheduleClick(listenAt + onset, RHYTHM));

      setRound(n);
      tapsRef.current = [];
      // Se aceptan golpes desde medio pulso antes de tu turno (quien se
      // adelanta un pelo no tiene por qué perder) hasta un poco después.
      windowRef.current = { from: playAt - b * 0.5, to: endAt };

      const tick = () => {
        const t = ctx.currentTime;
        if (t >= endAt) {
          setBeat(-1);
          windowRef.current = null;
          const taps = tapsRef.current;
          roundsRef.current = [...roundsRef.current, taps];
          if (pulsoMatches(pattern.onsets, taps)) {
            callbacks.current.onCheckpoint(roundsRef.current);
            if (n >= PULSO_MAX_ROUNDS) {
              setPhase("over");
              callbacks.current.onEnd(roundsRef.current, n);
            } else {
              setPhase("pass");
              nextRoundRef.current(n + 1, 0.6);
            }
          } else {
            setPhase("over");
            callbacks.current.onEnd(roundsRef.current, n - 1);
          }
          return;
        }

        const segment =
          t < t0 ? null : t < listenAt ? t0 : t < readyAt ? listenAt : t < playAt ? readyAt : playAt;
        setPhase(
          t < listenAt ? (n > 1 && t < t0 ? "pass" : "countin") : t < readyAt ? "listen" : t < playAt ? "ready" : "play",
        );
        setBeat(segment === null ? -1 : Math.floor((t - segment) / b) % 4);
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    },
    [seedKey],
  );

  useEffect(() => {
    nextRoundRef.current = playRound;
  }, [playRound]);

  useEffect(() => {
    // Montarse es empezar: el juego arranca el audio, que es un sistema de fuera.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    playRound(1);
    return () => {
      cancelAnimationFrame(frameRef.current);
      if (flashRef.current) window.clearTimeout(flashRef.current);
    };
  }, [playRound]);

  const tap = useCallback(() => {
    const ctx = audioContext();
    const t = ctx.currentTime;
    scheduleClick(t, TAP);
    navigator.vibrate?.(10);
    setFlash(true);
    if (flashRef.current) window.clearTimeout(flashRef.current);
    flashRef.current = window.setTimeout(() => setFlash(false), 90);
    const range = windowRef.current;
    if (range && t >= range.from && t <= range.to) tapsRef.current.push(t);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      event.preventDefault();
      tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  const yourTurn = phase === "play" || phase === "ready";

  return (
    <div className="flex flex-col items-center">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-white/45">Ronda {round || 1}</p>
      <p className={`min-h-[1.75rem] text-lg font-black ${phase === "play" ? "text-amber-300" : "text-white"}`}>
        {LABEL[phase]}
      </p>

      <div className="my-5 flex gap-3" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-3.5 w-3.5 rounded-full transition-all duration-75 ${
              beat === index
                ? `${index === 0 ? "scale-125 bg-amber-300" : "scale-110 bg-white"} shadow-[0_0_12px_rgba(252,211,77,0.7)]`
                : "bg-white/15"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onPointerDown={(event) => {
          event.preventDefault();
          tap();
        }}
        disabled={phase === "over"}
        aria-label="Golpe"
        className={`grid aspect-square w-full max-w-[min(72vw,300px)] select-none place-items-center rounded-full border-4 text-sm font-black uppercase tracking-[0.2em] transition-[transform,background-color,border-color] duration-75 ${
          flash ? "scale-[0.97]" : ""
        } ${
          yourTurn
            ? "border-amber-300/80 bg-amber-400/25 text-amber-100"
            : "border-white/15 bg-slate-950/70 text-white/40"
        } ${flash ? "bg-amber-300/45" : ""}`}
        style={{ touchAction: "manipulation" }}
      >
        {yourTurn ? "Toca" : "🥁"}
      </button>
      <p className="mt-4 text-center text-[11px] text-white/45">También con la barra espaciadora.</p>
    </div>
  );
}
