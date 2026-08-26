"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import ChordSpellGame from "../../ChordSpellGame";
import { findChordSpellLevel } from "@/lib/staffChords";

export default function EscribirAcordeNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findChordSpellLevel(nivel);
  if (!level) notFound();

  return <ChordSpellGame level={level} />;
}
