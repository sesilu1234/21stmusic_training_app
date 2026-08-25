"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import PianoIntervalGame from "../PianoIntervalGame";
import { findPianoIntervalLevel } from "@/lib/pianoIntervals";

export default function PianoIntervalosNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findPianoIntervalLevel(nivel);
  if (!level) notFound();

  return <PianoIntervalGame level={level} />;
}
