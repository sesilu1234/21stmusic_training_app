"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import PianoBuildGame from "../../PianoBuildGame";
import { findScaleBuildLevel } from "@/lib/pianoBuild";

export default function PianoEscalasNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findScaleBuildLevel(nivel);
  if (!level) notFound();

  return <PianoBuildGame level={level} backHref="/play/piano/escalas" />;
}
