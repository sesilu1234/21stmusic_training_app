"use client";

import { useSyncExternalStore } from "react";
import { ALL_PIANO_SEMITONES, pianoIntervalSelection } from "@/lib/pianoIntervals";

// Los intervalos que se marcaron la última vez en los modos de intervalos de
// piano (Reconoce y Toca), cada uno con su propia clave. Igual que
// useStoredEarSet de oído: se recuerda en el navegador, y con
// useSyncExternalStore para que el servidor pinte "todos" sin que React se
// queje al hidratar.

const CHANGE_EVENT = "piano-intervalos-change";

/** Lo guardado: semitonos separados por comas. null = nunca se ha tocado, todos. */
const readStored = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
};

/** `storageKey`: dónde se guarda lo marcado; uno por modo. */
export const useStoredPianoIntervals = (storageKey: string) => {
  const stored = useSyncExternalStore(subscribe, () => readStored(storageKey), () => null);

  /** Lo marcado, en el orden de siempre. */
  const marked =
    stored === null
      ? ALL_PIANO_SEMITONES
      : ALL_PIANO_SEMITONES.filter((value) => stored.split(",").map(Number).includes(value));

  /** Con lo que se juega: lo marcado si vale, y si no llega al mínimo, null. */
  const selection =
    stored === null ? { semitones: ALL_PIANO_SEMITONES, custom: false } : pianoIntervalSelection(marked);

  const setMarked = (next: number[]) => {
    try {
      window.localStorage.setItem(storageKey, next.join(","));
    } catch {
      // Sin almacenamiento se elige igual; solo que no se recuerda.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return { marked, selection, setMarked };
};
