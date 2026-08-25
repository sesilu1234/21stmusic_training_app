"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import PianoBuildGame from "../../PianoBuildGame";
import { findChordBuildLevel } from "@/lib/pianoBuild";

export default function PianoAcordesNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findChordBuildLevel(nivel);
  if (!level) notFound();

  return <PianoBuildGame level={level} backHref="/play/piano/acordes" />;
}
