"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import ChordNameGame from "../../ChordNameGame";
import { findChordNameLevel } from "@/lib/staffChords";

export default function NombrarAcordeNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findChordNameLevel(nivel);
  if (!level) notFound();

  return <ChordNameGame level={level} />;
}
