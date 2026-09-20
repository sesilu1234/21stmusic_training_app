"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import NotasGame from "../../NotasGame";
import { findAcordeNivel } from "@/lib/noteSpelling";

export default function AcordeNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findAcordeNivel(nivel);
  if (!level) notFound();

  return (
    <NotasGame
      tipo="acorde"
      nivel={level}
      backHref="/play/construye-acordes"
      subtitulo={`${level.badge} · ${level.title}`}
    />
  );
}
