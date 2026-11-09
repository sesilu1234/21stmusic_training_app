"use client";

import { useCallback, useEffect, useState } from "react";
import { Delete, Waves } from "lucide-react";

/** Dónde se recuerda el "Dejar sonar" (el mismo para todos los modos). */
const LET_RING_KEY = "ear-let-ring";

/**
 * "Dejar sonar": encendido (lo normal), los acordes o notas se quedan sonando
 * y se mezclan, como con el pedal; apagado, cada uno se apaga al entrar el
 * siguiente, como un pianista que levanta los dedos. Se recuerda entre modos.
 */
export function useLetRing() {
  const [letRing, setState] = useState(true);
  useEffect(() => {
    try {
      // Solo se apaga si alguien lo apagó: sin nada guardado, suena.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(LET_RING_KEY) === "0") setState(false);
    } catch {
      // Sin almacenamiento: dejando sonar.
    }
  }, []);
  const setLetRing = useCallback((value: boolean) => {
    setState(value);
    try {
      localStorage.setItem(LET_RING_KEY, value ? "1" : "0");
    } catch {
      // Solo no se recuerda.
    }
  }, []);
  return { letRing, setLetRing };
}

/** El botón de "Dejar sonar", con su mini interruptor. */
export function LetRingToggle({
  letRing,
  setLetRing,
}: {
  letRing: boolean;
  setLetRing: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setLetRing(!letRing)}
      aria-pressed={letRing}
      title={
        letRing
          ? "Se quedan sonando y se mezclan, como con el pedal"
          : "Cada sonido se apaga al entrar el siguiente"
      }
      className={`inline-flex items-center gap-2 rounded-full border py-2 pl-3 pr-2 text-[10px] font-black uppercase tracking-[0.18em] transition ${
        letRing
          ? "border-violet-300/40 bg-violet-400/10 text-violet-100"
          : "border-white/10 bg-white/[0.03] text-white/40 hover:border-white/25 hover:text-white/70"
      }`}
    >
      <Waves size={14} strokeWidth={2} className={letRing ? "text-violet-300" : ""} />
      Dejar sonar
      {/* Mini interruptor: se ve de un vistazo si está puesto. */}
      <span
        aria-hidden="true"
        className={`relative ml-0.5 h-4 w-7 rounded-full transition-colors ${
          letRing ? "bg-violet-400" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
            letRing ? "left-3.5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/** El "Borrar" de los modos donde se marcan varias respuestas: quita la última. */
export function UndoButton({
  onClick,
  disabled,
  title = "Quitar la última marcada",
}: {
  onClick: () => void;
  disabled: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] py-2 pl-3 pr-3.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/40 transition hover:border-white/25 hover:text-white/75 disabled:cursor-default disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-white/40"
    >
      <Delete size={14} strokeWidth={2} />
      Borrar
    </button>
  );
}
