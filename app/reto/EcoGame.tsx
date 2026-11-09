"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioContext, playNow, scheduleNotes } from "@/app/components/notePlayer";
import {
  ECO_LEAD_IN,
  ECO_MAX_ROUNDS,
  ECO_NOTES,
  ECO_VISUAL_ROUNDS,
  ecoGap,
  ecoSequence,
} from "@/lib/eco";

/** Una octava por encima del Do central: en el móvil se oye mejor. */
const PITCH_OFFSET = 12;

// --- El pentágono ------------------------------------------------------

const RADIUS = 96;
const vertex = (index: number) => {
  const angle = ((-90 + index * 72) * Math.PI) / 180;
  return [RADIUS * Math.cos(angle), RADIUS * Math.sin(angle)] as const;
};

/** El quesito `index`: del centro a dos vértices seguidos. */
const wedgePath = (index: number) => {
  const [x1, y1] = vertex(index);
  const [x2, y2] = vertex(index + 1);
  return `M0,0 L${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)} Z`;
};

/** Dónde va el nombre de la nota: hacia fuera, en medio del quesito. */
const labelPoint = (index: number) => {
  const [x1, y1] = vertex(index);
  const [x2, y2] = vertex(index + 1);
  return [((x1 + x2) / 2) * 0.66, ((y1 + y2) / 2) * 0.66] as const;
};

const Pentagon = ({
  lit,
  disabled,
  onPress,
  center,
}: {
  lit: number | null;
  disabled: boolean;
  onPress: (index: number) => void;
  center: string;
}) => (
  <svg
    viewBox="-100 -100 200 200"
    className="mx-auto block aspect-square w-full max-w-[min(88vw,420px)] select-none"
    style={{ touchAction: "manipulation" }}
    role="group"
    aria-label="Pentágono de notas"
  >
    {ECO_NOTES.map((note, index) => {
      const [lx, ly] = labelPoint(index);
      const on = lit === index;
      return (
        <g
          key={note.name}
          role="button"
          aria-label={note.name}
          aria-disabled={disabled}
          onPointerDown={(event) => {
            event.preventDefault();
            if (!disabled) onPress(index);
          }}
          className={disabled ? "cursor-default" : "cursor-pointer"}
        >
          <path
            d={wedgePath(index)}
            fill={on ? note.lit : note.fill}
            stroke="#0b1120"
            strokeWidth={3.5}
            strokeLinejoin="round"
            style={{
              transition: "fill 90ms",
              filter: on ? `drop-shadow(0 0 10px ${note.lit})` : undefined,
              opacity: disabled && !on ? 0.75 : 1,
            }}
          />
          <text
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={900}
            fill={on ? "#0b1120" : "rgba(255,255,255,0.85)"}
            pointerEvents="none"
          >
            {note.name}
          </text>
        </g>
      );
    })}
    <circle r={25} fill="#0b1120" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} pointerEvents="none" />
    <text
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={center.length > 2 ? 11 : 20}
      fontWeight={900}
      fill="#fcd34d"
      pointerEvents="none"
    >
      {center}
    </text>
  </svg>
);

// --- La partida --------------------------------------------------------

/**
 * Una partida de Eco. Empieza sola al montarse (el audio ya lo desbloqueó el
 * botón de "Empezar" de fuera) y avisa:
 *
 *   · `onCheckpoint` al superar cada ronda, con todo lo pulsado hasta ahí,
 *     para que se guarde por si se corta;
 *   · `onEnd` al fallar (o al llegar al tope), con todo lo pulsado.
 *
 * `seedKey` es el día, o una clave al azar si se está practicando.
 */
export default function EcoGame({
  seedKey,
  onCheckpoint,
  onEnd,
}: {
  seedKey: string;
  onCheckpoint: (taps: number[]) => void;
  onEnd: (taps: number[], score: number) => void;
}) {
  const [phase, setPhase] = useState<"listen" | "input" | "over">("listen");
  const [round, setRound] = useState(0);
  const [lit, setLit] = useState<number | null>(null);

  const sequenceRef = useRef<number[]>(ecoSequence(seedKey));
  const tapsRef = useRef<number[]>([]);
  /** Por qué nota de la ronda va el alumno. */
  const posRef = useRef(0);
  const frameRef = useRef<number>(0);
  const flashRef = useRef<number | null>(null);

  /**
   * Toca la ronda `n`. Todo va programado en el reloj del audio: las notas,
   * y también cuándo se enciende cada quesito, que se mira en cada fotograma
   * contra `ctx.currentTime` para que la luz y el sonido vayan juntos.
   */
  const playRound = useCallback((n: number) => {
    const ctx = audioContext();
    const gap = ecoGap(n);
    const start = ctx.currentTime + ECO_LEAD_IN;
    const notes = sequenceRef.current.slice(0, n);

    notes.forEach((note, k) => scheduleNotes([ECO_NOTES[note].semitone + PITCH_OFFSET], start + k * gap));

    setRound(n);
    setPhase("listen");
    posRef.current = 0;

    const visual = n <= ECO_VISUAL_ROUNDS;
    const end = start + notes.length * gap;
    const tick = () => {
      const t = ctx.currentTime;
      if (t >= end - gap * 0.2) {
        setLit(null);
        setPhase("input");
        return;
      }
      if (visual) {
        const k = Math.floor((t - start) / gap);
        const within = t - start - k * gap;
        setLit(k >= 0 && k < notes.length && within < gap * 0.72 ? notes[k] : null);
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    // Montarse es empezar: el juego arranca el audio, que es un sistema de fuera.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    playRound(1);
    return () => {
      cancelAnimationFrame(frameRef.current);
      if (flashRef.current) window.clearTimeout(flashRef.current);
    };
  }, [playRound]);

  const press = (index: number) => {
    if (phase !== "input") return;
    playNow(ECO_NOTES[index].semitone + PITCH_OFFSET);
    // Un toque de vibración en Android; en iPhone no existe y no pasa nada.
    navigator.vibrate?.(15);
    setLit(index);
    if (flashRef.current) window.clearTimeout(flashRef.current);
    flashRef.current = window.setTimeout(() => setLit(null), 180);

    tapsRef.current.push(index);
    if (index !== sequenceRef.current[posRef.current]) {
      setPhase("over");
      onEnd([...tapsRef.current], round - 1);
      return;
    }
    posRef.current += 1;
    if (posRef.current >= round) {
      onCheckpoint([...tapsRef.current]);
      if (round >= ECO_MAX_ROUNDS) {
        setPhase("over");
        onEnd([...tapsRef.current], round);
      } else {
        playRound(round + 1);
      }
    }
  };

  const earOnly = round > ECO_VISUAL_ROUNDS;

  return (
    <div>
      <p className="mb-4 min-h-[1.5rem] text-center text-sm font-bold text-white/80">
        {phase === "listen" && (earOnly ? "🔇 Solo oído · escucha…" : "Escucha…")}
        {phase === "input" && (earOnly ? "🔇 Solo oído · ahora tú, sin prisa" : "Ahora tú, sin prisa")}
        {phase === "over" && "Fin"}
      </p>
      <Pentagon lit={lit} disabled={phase !== "input"} onPress={press} center={String(round)} />
    </div>
  );
}
