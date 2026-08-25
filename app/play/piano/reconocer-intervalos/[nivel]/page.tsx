"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import PianoRecognizeGame from "../PianoRecognizeGame";
import { findPianoIntervalLevel } from "@/lib/pianoIntervals";

export default function PianoReconocerNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findPianoIntervalLevel(nivel);
  if (!level) notFound();

  return <PianoRecognizeGame level={level} />;
}
