"use client";

import NotasGame from "../NotasGame";

/**
 * El único de los tres que no tiene niveles, y no es un olvido: la lista de
 * intervalos es corta y la dificultad está en cada uno, no en cuántos salgan.
 * Partirla en cuatro pantallas sería repartir doce preguntas en cuatro sitios.
 */
export default function ConstruyeIntervalosPage() {
  return (
    <NotasGame
      tipo="intervalo"
      backHref="/"
      subtitulo="De la 2ª a la 7ª · subiendo y bajando"
    />
  );
}
