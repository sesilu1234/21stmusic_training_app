"use client";

import { useSyncExternalStore } from "react";
import { ALL_EAR_INTERVALS, FULL_EAR_SET, earIntervalSet } from "@/lib/earIntervals";

// Los intervalos que se marcaron la última vez en /play/oido.
//
// Se recuerda en el navegador para que al volver esté marcado lo mismo. Con
// `useSyncExternalStore` y no con un efecto: en el servidor no hay
// localStorage, así que allí se pintan todos y en el navegador se corrige sin
// que React se queje de que no casan.
//
// Se guarda lo marcado tal cual, aunque no llegue al mínimo: si no, "Desmarcar
// todos" no podría dejar nada desmarcado para empezar a elegir desde cero.

const STORAGE_KEY = "21st_oido_marcados";
const CHANGE_EVENT = "oido-intervalos-change";

/** Lo guardado: los nombres separados por comas. null = nunca se ha tocado, todos. */
const readStored = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
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

export const useStoredEarSet = () => {
  const stored = useSyncExternalStore(subscribe, readStored, () => null);

  /** Lo marcado, en el orden de siempre. */
  const marked =
    stored === null
      ? ALL_EAR_INTERVALS
      : ALL_EAR_INTERVALS.filter((name) => stored.split(",").includes(name));

  /** Con lo que se juega: lo marcado si vale, y si no llega al mínimo, null. */
  const set = stored === null ? FULL_EAR_SET : earIntervalSet(marked);

  const setMarked = (next: string[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next.join(","));
    } catch {
      // Sin almacenamiento se elige igual; solo que no se recuerda.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return { marked, set, setMarked };
};
