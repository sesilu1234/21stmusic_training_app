"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import MelodyEarGame from "../MelodyEarGame";
import { findMelodyLevel } from "@/lib/melodyEar";

export default function DictadoNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findMelodyLevel(nivel);
  if (!level) notFound();

  return <MelodyEarGame level={level} backHref="/play/oido/dictado" />;
}
