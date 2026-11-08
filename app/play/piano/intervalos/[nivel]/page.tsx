"use client";

import { use, useMemo } from "react";
import { notFound } from "next/navigation";
import PianoIntervalGame from "../PianoIntervalGame";
import {
  ALL_INTERVALS_LEVEL,
  findPianoIntervalLevel,
  pianoIntervalSelectionFromParam,
} from "@/lib/pianoIntervals";

export default function PianoIntervalosNivelPage({
  params,
  searchParams,
}: {
  params: Promise<{ nivel: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { nivel } = use(params);
  const { iv } = use(searchParams);

  // El nivel de ahora: los doce, o los que se eligieron a mano (?iv=3,4,7),
  // que es práctica y no se guarda. Memorizado: el juego empieza partida nueva
  // cuando cambia el nivel, y un objeto nuevo en cada render la reiniciaría.
  const ivKey = Array.isArray(iv) ? iv[0] : iv;
  const custom = useMemo(() => {
    const selection = pianoIntervalSelectionFromParam(ivKey);
    return selection.custom
      ? {
          ...ALL_INTERVALS_LEVEL,
          badge: "Práctica",
          title: "Intervalos elegidos",
          semitones: selection.semitones,
        }
      : null;
  }, [ivKey]);

  if (nivel === ALL_INTERVALS_LEVEL.slug) {
    // El `key` hace que otra selección sea una partida nueva entera.
    return (
      <PianoIntervalGame
        key={ivKey ?? "todos"}
        level={custom ?? ALL_INTERVALS_LEVEL}
        practice={custom !== null}
      />
    );
  }

  // Los niveles viejos (basicos, diatonicos…) siguen abriendo si alguien tiene
  // la URL guardada.
  const level = findPianoIntervalLevel(nivel);
  if (!level) notFound();

  return <PianoIntervalGame level={level} />;
}
