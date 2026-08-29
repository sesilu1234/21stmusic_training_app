"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import RhythmGame from "../RhythmGame";
import { findRhythmLevel } from "@/lib/rhythm";

export default function RitmoNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findRhythmLevel(nivel);
  if (!level) notFound();

  return <RhythmGame level={level} />;
}
