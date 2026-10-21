"use client";

import { useEffect, useState } from "react";

// Diestro o zurdo, para los dibujos del mástil.
//
// Las imágenes del diapasón son las de diestro, y así se enseñan por defecto.
// En zurdo se ponen en espejo horizontal. Las imágenes no llevan números ni
// letras, así que voltearlas no deja nada escrito del revés.
//
// Se guarda en el navegador: es una preferencia del aparato, como el tema.

const HANDEDNESS_KEY = "21st_handedness";
const CHANGE_EVENT = "handedness-change";

const getStoredLeftHanded = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HANDEDNESS_KEY) === "zurdo";
  } catch {
    return false;
  }
};

const setStoredLeftHanded = (leftHanded: boolean) => {
  try {
    window.localStorage.setItem(HANDEDNESS_KEY, leftHanded ? "zurdo" : "diestro");
  } catch {
    // Sin almacenamiento (modo privado estricto) se cambia igual, solo que no
    // se recuerda para la próxima vez.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const useLeftHanded = () => {
  const [leftHanded, setLeftHandedState] = useState(false);

  useEffect(() => {
    const sync = () => setLeftHandedState(getStoredLeftHanded());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const setLeftHanded = (next: boolean) => {
    setLeftHandedState(next);
    setStoredLeftHanded(next);
  };

  return [leftHanded, setLeftHanded] as const;
};

/** La clase que lleva la imagen del mástil: en espejo solo para zurdo. */
export const fretboardFlipClass = (leftHanded: boolean) =>
  leftHanded ? "-scale-x-100" : "";
