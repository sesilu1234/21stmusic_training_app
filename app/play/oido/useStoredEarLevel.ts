"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_EAR_LEVEL,
  EAR_INTERVAL_LEVELS,
  earLevelFromParam,
  type EarIntervalLevel,
} from "@/lib/earIntervals";

// El último nivel de intervalos al oído que se eligió en /play/oido.
//
// Se recuerda en el navegador para que al volver esté marcado el mismo. Con
// `useSyncExternalStore` y no con un efecto: en el servidor no hay
// localStorage, así que allí se pinta el nivel 1 y en el navegador se corrige
// sin que React se queje de que no casan.

const STORAGE_KEY = "21st_oido_nivel";
const CHANGE_EVENT = "oido-nivel-change";

const readStoredLevelId = () => {
  try {
    return earLevelFromParam(window.localStorage.getItem(STORAGE_KEY) ?? undefined).id;
  } catch {
    return DEFAULT_EAR_LEVEL.id;
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

export const useStoredEarLevel = () => {
  const id = useSyncExternalStore(subscribe, readStoredLevelId, () => DEFAULT_EAR_LEVEL.id);
  const level = EAR_INTERVAL_LEVELS.find((item) => item.id === id) ?? DEFAULT_EAR_LEVEL;

  const setLevel = (next: EarIntervalLevel) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next.id));
    } catch {
      // Sin almacenamiento se elige igual; solo que no se recuerda.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return [level, setLevel] as const;
};
