"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import NotasGame from "../../NotasGame";
import { findEscalaNivel } from "@/lib/noteSpelling";

export default function EscalaNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findEscalaNivel(nivel);
  if (!level) notFound();

  return (
    <NotasGame
      tipo="escala"
      nivel={level}
      backHref="/play/construye-escalas"
      subtitulo={`${level.badge} · ${level.title}`}
    />
  );
}
