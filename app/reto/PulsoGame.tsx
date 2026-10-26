"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioContext, scheduleClick, scheduleSnare } from "@/app/components/notePlayer";
import {
  PULSO_COUNT_IN,
  PULSO_LEAD_IN,
  PULSO_MAX_ROUNDS,
  PULSO_TAIL_BEATS,
  pulsoMatches,
  pulsoPattern,
  type PulsoPattern,
} from "@/lib/pulso";

type Phase = "countin" | "listen" | "ready" | "play" | "pass" | "over";

/**
 * Los sonidos. El ritmo y tus golpes son una caja; el metrónomo, un clic agudo
 * y limpio. Así nunca se confunde lo que cuenta con lo que hay que repetir.
 * El metrónomo solo suena en las entradas: dentro del ritmo y de tu turno, nada.
 */
const COUNT = { freq: 1250, gain: 0.55, decay: 0.04 };
const COUNT_ACCENT = { freq: 1650, gain: 0.65, decay: 0.04 };
const RHYTHM_GAIN = 0.9;
const TAP_GAIN = 0.6;

const LABEL: Record<Phase, string> = {
  countin: "Escucha…",
  listen: "Escucha el ritmo",
  ready: "Prepárate…",
  play: "¡Ahora tú!",
  pass: "¡Bien!",
  over: "Fin",
};

/**
 * Lo que enseña la pista. Las posiciones van en pulsos desde el principio de
 * la pista: 0-4 es el compás del metrónomo y de 4 en adelante, el ritmo.
 */
interface Track {
  /** "listen": suena el ritmo. "play": tu turno. */
  mode: "listen" | "play";
  /** Dónde va el cursor, en pulsos. null = parado, sin cursor. */
  cursor: number | null;
  /** Tus golpes, en pulsos desde el principio de la pista. */
  taps: number[];
  /** Al fallar: se enseña el ritmo que era, junto a lo que tocaste. */
  reveal: boolean;
}

const IDLE: Track = { mode: "listen", cursor: null, taps: [], reveal: false };

/**
 * La pista: un compás gris para el metrónomo y luego el compás (o los dos) del
 * ritmo, con sus cuatro pulsos marcados y un cursor que los recorre.
 */
function PulsoTrack({ pattern, track }: { pattern: PulsoPattern | null; track: Track }) {
  const measures = pattern?.measures ?? 1;
  const total = PULSO_COUNT_IN + measures * 4;
  const at = (beats: number) => `${(beats / total) * 100}%`;
  const notes = pattern ? pattern.onsets.map((onset) => PULSO_COUNT_IN + onset / pattern.beat) : [];
  const cursor = track.cursor;
  // El pulso del metrónomo que está sonando, para encender su punto.
  const countBeat = cursor !== null && cursor < PULSO_COUNT_IN ? Math.floor(cursor) : -1;

  return (
    <div className="w-full max-w-xl select-none px-3" aria-hidden>
      <div className="mb-1.5 flex text-[9px] font-black uppercase tracking-[0.2em]">
        <span style={{ width: at(PULSO_COUNT_IN) }} className="text-white/25">
          Metrónomo
        </span>
        <span className={track.mode === "play" ? "text-amber-300/80" : "text-white/50"}>
          {track.mode === "play" ? "Tú" : "Ritmo"}
        </span>
      </div>

      <div className="relative h-16">
        {/* El compás del metrónomo: gris y con los pulsos como puntos. */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-lg border border-dashed border-white/10 bg-white/[0.02]"
          style={{ width: at(PULSO_COUNT_IN) }}
        />
        {Array.from({ length: PULSO_COUNT_IN }, (_, k) => (
          <span
            key={`count-${k}`}
            className={`absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-75 ${
              countBeat === k ? "bg-white/70" : "bg-white/15"
            }`}
            style={{ left: at(k + 0.5) }}
          />
        ))}

        {/* Los compases del ritmo, con barra al principio y al final de cada uno. */}
        {Array.from({ length: measures }, (_, m) => (
          <div
            key={`measure-${m}`}
            className={`absolute inset-y-0 border-y border-l-2 border-white/15 bg-slate-950/70 ${
              m === measures - 1 ? "rounded-r-lg border-r-2" : ""
            }`}
            style={{ left: at(PULSO_COUNT_IN + m * 4), width: at(4) }}
          >
            {[1, 2, 3].map((beat) => (
              <span
                key={beat}
                className="absolute inset-y-3 w-px bg-white/[0.08]"
                style={{ left: `${(beat / 4) * 100}%` }}
              />
            ))}
          </div>
        ))}

        {/* El ritmo: mientras suena, cada nota aparece al pasar el cursor.
            En tu turno no se ve (sería leerlo), salvo al fallar. */}
        {notes.map((position, index) => {
          const heard = track.mode === "listen" && cursor !== null && cursor >= position;
          if (!heard && !track.reveal) return null;
          return (
            <span
              key={`note-${index}`}
              className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                track.reveal ? "border-2 border-amber-300/80" : "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.6)]"
              }`}
              style={{ left: at(position) }}
            />
          );
        })}

        {/* Tus golpes: una raya donde has tocado. */}
        {track.mode === "play" &&
          track.taps.map((position, index) => (
            <span
              key={`tap-${index}`}
              className="absolute top-1/2 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
              style={{ left: at(Math.min(total, Math.max(0, position))) }}
            />
          ))}

        {cursor !== null && (
          <span
            className="absolute -inset-y-1.5 w-0.5 -translate-x-1/2 rounded-full bg-amber-300"
            style={{ left: at(Math.min(total, cursor)) }}
          />
        )}
      </div>

      {track.reveal && (
        <p className="mt-2 text-center text-[11px] text-white/45">
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-amber-300/80 align-middle" /> el
          ritmo · <span className="mx-1 inline-block h-3 w-1 rounded-full bg-white align-middle" /> lo que tocaste
        </p>
      )}
    </div>
  );
}

/**
 * Una partida de Pulso. Empieza sola al montarse, como `EcoGame`, y avisa con
 * `onCheckpoint` al superar cada ronda y con `onEnd` al fallar.
 *
 * Todo va en el reloj del audio: los sonidos se programan con `ctx.currentTime`
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
  const [pattern, setPattern] = useState<PulsoPattern | null>(null);
  const [track, setTrack] = useState<Track>(IDLE);
  const [flash, setFlash] = useState(false);

  const roundsRef = useRef<number[][]>([]);
  const tapsRef = useRef<number[]>([]);
  const windowRef = useRef<{ from: number; to: number } | null>(null);
  /** Cuándo empieza la pista de tu turno y lo que dura un pulso, para colocar tus golpes. */
  const playTrackRef = useRef<{ start: number; beat: number } | null>(null);
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
      const next = pulsoPattern(seedKey, n);
      const b = next.beat;

      // Entrada (metrónomo) · ritmo (caja) · entrada (metrónomo) · tu turno.
      const t0 = ctx.currentTime + PULSO_LEAD_IN + pause;
      const listenAt = t0 + PULSO_COUNT_IN * b;
      const readyAt = listenAt + next.seconds;
      const playAt = readyAt + PULSO_COUNT_IN * b;
      const endAt = playAt + next.seconds + PULSO_TAIL_BEATS * b;

      for (let k = 0; k < PULSO_COUNT_IN; k++) {
        scheduleClick(t0 + k * b, k === 0 ? COUNT_ACCENT : COUNT);
        scheduleClick(readyAt + k * b, k === 0 ? COUNT_ACCENT : COUNT);
      }
      next.onsets.forEach((onset) => scheduleSnare(listenAt + onset, RHYTHM_GAIN));

      setRound(n);
      setPattern(next);
      tapsRef.current = [];
      playTrackRef.current = { start: readyAt, beat: b };
      // Se aceptan golpes desde medio pulso antes de tu turno (quien se
      // adelanta un pelo no tiene por qué perder) hasta un poco después.
      windowRef.current = { from: playAt - b * 0.5, to: endAt };

      const tick = () => {
        const t = ctx.currentTime;
        if (t >= endAt) {
          windowRef.current = null;
          const taps = tapsRef.current;
          roundsRef.current = [...roundsRef.current, taps];
          if (pulsoMatches(next.onsets, taps)) {
            setTrack((current) => ({ ...current, cursor: null }));
            callbacks.current.onCheckpoint(roundsRef.current);
            if (n >= PULSO_MAX_ROUNDS) {
              setPhase("over");
              callbacks.current.onEnd(roundsRef.current, n);
            } else {
              setPhase("pass");
              nextRoundRef.current(n + 1, 0.6);
            }
          } else {
            // Con los mismos golpes que notas, se quita el retraso medio, igual
            // que hace la corrección: con cascos Bluetooth todo saldría corrido.
            const notes = next.onsets.map((onset) => PULSO_COUNT_IN + onset / b);
            setTrack((current) => {
              const sorted = [...current.taps].sort((x, y) => x - y);
              const shift =
                sorted.length === notes.length
                  ? sorted.reduce((sum, tapAt, i) => sum + (tapAt - notes[i]), 0) / sorted.length
                  : 0;
              return { ...current, cursor: null, reveal: true, taps: sorted.map((tapAt) => tapAt - shift) };
            });
            setPhase("over");
            callbacks.current.onEnd(roundsRef.current, n - 1);
          }
          return;
        }

        if (t < t0) {
          if (n === 1) setPhase("countin");
        } else if (t < readyAt) {
          setPhase(t < listenAt ? "countin" : "listen");
          setTrack({ mode: "listen", cursor: (t - t0) / b, taps: [], reveal: false });
        } else {
          setPhase(t < playAt ? "ready" : "play");
          setTrack((current) => ({
            mode: "play",
            cursor: (t - readyAt) / b,
            taps: current.mode === "play" ? current.taps : [],
            reveal: false,
          }));
        }
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
    scheduleSnare(t, TAP_GAIN);
    navigator.vibrate?.(10);
    setFlash(true);
    if (flashRef.current) window.clearTimeout(flashRef.current);
    flashRef.current = window.setTimeout(() => setFlash(false), 90);
    const range = windowRef.current;
    if (range && t >= range.from && t <= range.to) {
      tapsRef.current.push(t);
      const ref = playTrackRef.current;
      if (ref) {
        const position = (t - ref.start) / ref.beat;
        setTrack((current) => (current.mode === "play" ? { ...current, taps: [...current.taps, position] } : current));
      }
    }
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

      <div className="my-6 flex w-full justify-center">
        <PulsoTrack pattern={pattern} track={track} />
      </div>

      <button
        type="button"
        onPointerDown={(event) => {
          event.preventDefault();
          tap();
        }}
        disabled={phase === "over"}
        aria-label="Golpe"
        className={`grid aspect-square w-full max-w-[min(60vw,240px)] select-none place-items-center rounded-full border-4 text-sm font-black uppercase tracking-[0.2em] transition-[transform,background-color,border-color] duration-75 ${
          flash ? "scale-[0.97]" : ""
        } ${
          yourTurn
            ? "border-amber-300/80 bg-amber-400/25 text-amber-100"
            : "border-white/15 bg-slate-950/70 text-white/40"
        } ${flash ? "bg-amber-300/45" : ""}`}
        style={{ touchAction: "manipulation" }}
      >
        {yourTurn ? "Toca" : "Escucha"}
      </button>
      <p className="mt-4 text-center text-[11px] text-white/45">También con la barra espaciadora.</p>
    </div>
  );
}
