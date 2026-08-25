"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Waves } from "lucide-react";
import Backdrop from "@/app/components/Backdrop";
import SiteFooter from "@/app/components/SiteFooter";
import PianoKeyboard, { noteName, type KeyMark } from "@/app/components/PianoKeyboard";
import { VOICES, useFreeSynth, type Voice } from "@/lib/freeSynth";

/**
 * Piano suelto para trastear. No puntúa ni pregunta nada: se toca y ya.
 *
 * El teclado del ordenador sigue el reparto de siempre en cualquier programa
 * de música: las blancas en la fila de la "a" y las negras justo encima, en la
 * fila de la "q". Así la forma que dibujan las teclas del ordenador es la
 * misma que la del piano.
 */

/** Semitono (relativo al Do de la izquierda) → tecla del ordenador. */
const KEY_MAP: { semitone: number; label: string; code: string; key: string }[] = [
  { semitone: 0, label: "a", code: "KeyA", key: "a" },
  { semitone: 1, label: "w", code: "KeyW", key: "w" },
  { semitone: 2, label: "s", code: "KeyS", key: "s" },
  { semitone: 3, label: "e", code: "KeyE", key: "e" },
  { semitone: 4, label: "d", code: "KeyD", key: "d" },
  { semitone: 5, label: "f", code: "KeyF", key: "f" },
  { semitone: 6, label: "t", code: "KeyT", key: "t" },
  { semitone: 7, label: "g", code: "KeyG", key: "g" },
  { semitone: 8, label: "y", code: "KeyY", key: "y" },
  { semitone: 9, label: "h", code: "KeyH", key: "h" },
  { semitone: 10, label: "u", code: "KeyU", key: "u" },
  { semitone: 11, label: "j", code: "KeyJ", key: "j" },
  { semitone: 12, label: "k", code: "KeyK", key: "k" },
  { semitone: 13, label: "o", code: "KeyO", key: "o" },
  { semitone: 14, label: "l", code: "KeyL", key: "l" },
  { semitone: 15, label: "p", code: "KeyP", key: "p" },
  // Las cuatro últimas son las teclas de la derecha del teclado español. Se
  // buscan también por `code` porque la ´ es tecla muerta: al pulsarla el
  // navegador manda key "Dead" y no el carácter.
  { semitone: 16, label: "ñ", code: "Semicolon", key: "ñ" },
  { semitone: 17, label: "´", code: "Quote", key: "´" },
  { semitone: 18, label: "+", code: "BracketRight", key: "+" },
  { semitone: 19, label: "ç", code: "Backslash", key: "ç" },
];

/** Octavas a las que se puede mover el teclado, en semitonos. */
const MIN_SHIFT = -24;
const MAX_SHIFT = 24;

export default function PianoLibrePage() {
  const { play: strikeVoice } = useFreeSynth();

  const [voice, setVoice] = useState<Voice>(VOICES[0]);
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const [active, setActive] = useState<number[]>([]);
  const [showNames, setShowNames] = useState(true);

  const voiceMenuRef = useRef<HTMLDivElement>(null);

  const play = useCallback(
    (semitone: number) => {
      strikeVoice(semitone, voice);
    },
    [strikeVoice, voice],
  );

  useEffect(() => {
    if (!isVoiceMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!voiceMenuRef.current?.contains(event.target as Node)) {
        setIsVoiceMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsVoiceMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isVoiceMenuOpen]);

  /** Suena y se enciende un momento: lo usan el ratón y el teclado. */
  const strike = useCallback(
    (semitone: number) => {
      play(semitone);
      setActive((current) =>
        current.includes(semitone) ? current : [...current, semitone],
      );
      window.setTimeout(
        () => setActive((current) => current.filter((note) => note !== semitone)),
        220,
      );
    },
    [play],
  );

  useEffect(() => {
    const byCode = new Map(KEY_MAP.map((entry) => [entry.code, entry.semitone]));
    const byKey = new Map(KEY_MAP.map((entry) => [entry.key, entry.semitone]));

    const held = new Set<string>();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;

      const semitone =
        byKey.get(event.key.toLowerCase()) ?? byCode.get(event.code);
      if (semitone === undefined) return;

      event.preventDefault();
      if (held.has(event.code)) return;
      held.add(event.code);

      const note = semitone + shift;
      play(note);
      setActive((current) =>
        current.includes(note) ? current : [...current, note],
      );
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!held.delete(event.code)) return;
      const semitone =
        byKey.get(event.key.toLowerCase()) ?? byCode.get(event.code);
      if (semitone === undefined) return;
      const note = semitone + shift;
      setActive((current) => current.filter((value) => value !== note));
    };

    // Al salir de la pestaña con una tecla pulsada no llega el keyup, y la
    // tecla se quedaría encendida para siempre.
    const onBlur = () => {
      held.clear();
      setActive([]);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [play, shift]);

  const marks = useMemo(() => {
    const result: Record<number, KeyMark> = {};
    active.forEach((note) => {
      result[note] = "hint";
    });
    return result;
  }, [active]);

  const hints = useMemo(() => {
    const result: Record<number, string> = {};
    KEY_MAP.forEach(({ semitone, label }) => {
      result[semitone + shift] = label;
    });
    return result;
  }, [shift]);

  // El teclado dibujado arranca en el Do de la mano izquierda y da dos octavas,
  // que es justo lo que abarca el mapa de teclas.
  const from = shift;

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-5 md:px-8 md:py-7">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 backdrop-blur-sm transition hover:border-slate-300/40 hover:text-white"
        >
          <ArrowLeft size={14} />
          Menú principal
        </Link>

        <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col justify-center py-8">
          <div className="mb-7 text-center">
            <h1
              className="text-balance text-2xl font-black italic uppercase leading-tight tracking-tighter text-white md:text-4xl"
              style={{ fontFamily: "Chaney, sans-serif" }}
            >
              Piano libre
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Toca con el ratón o con el teclado del ordenador. Ni puntúa ni
              corrige: es para trastear.
            </p>
          </div>

          {/* Controles: sonido, octava y nombres. */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5">
            <div ref={voiceMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsVoiceMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isVoiceMenuOpen}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 backdrop-blur-sm transition hover:border-white/25 hover:text-white"
              >
                <Waves size={13} strokeWidth={2} />
                {voice.label}
                <ChevronDown
                  size={13}
                  className={`transition-transform ${isVoiceMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isVoiceMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-1/2 top-[calc(100%+0.5rem)] z-50 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                >
                  {VOICES.map((option) => {
                    const selected = voice.id === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setVoice(option);
                          setIsVoiceMenuOpen(false);
                          // Se oye al elegirla: si no, hay que ir al teclado
                          // para saber si te gusta.
                          strikeVoice(shift, option);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition ${
                          selected
                            ? "bg-white/10 text-white"
                            : "text-white/55 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                            selected ? "bg-emerald-300" : "bg-white/20"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-black uppercase tracking-[0.12em]">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] font-normal normal-case tracking-normal text-white/35">
                            {option.hint}
                          </span>
                        </span>
                        {selected && (
                          <Check size={12} className="flex-shrink-0 text-emerald-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/60 p-1 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setShift((value) => Math.max(MIN_SHIFT, value - 12))}
                disabled={shift <= MIN_SHIFT}
                aria-label="Bajar una octava"
                className="grid h-7 w-7 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
              >
                <ChevronDown size={15} />
              </button>
              <span className="min-w-[4.5rem] text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
                {shift === 0 ? "Octava base" : `${shift > 0 ? "+" : ""}${shift / 12} oct.`}
              </span>
              <button
                type="button"
                onClick={() => setShift((value) => Math.min(MAX_SHIFT, value + 12))}
                disabled={shift >= MAX_SHIFT}
                aria-label="Subir una octava"
                className="grid h-7 w-7 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
              >
                <ChevronUp size={15} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowNames((value) => !value)}
              className={`rounded-full border px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                showNames
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-white/10 bg-slate-950/60 text-white/40 hover:text-white/80"
              }`}
            >
              Nombres
            </button>
          </div>

          <PianoKeyboard
            from={from}
            octaves={2}
            marks={marks}
            hints={hints}
            onPress={strike}
            showLabels={showNames}
          />

          <p className="mt-6 text-center text-[11px] leading-relaxed text-white/30">
            Blancas en la fila de la <span className="text-white/60">a</span>, negras
            justo encima. La octava de arriba sigue en{" "}
            <span className="text-white/60">k o l p ñ ´ + ç</span>.
          </p>

          <p className="mt-1.5 text-center text-[11px] text-white/25">
            {active.length > 0
              ? active
                  .slice()
                  .sort((a, b) => a - b)
                  .map((note) => noteName(note))
                  .join(" · ")
              : " "}
          </p>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
