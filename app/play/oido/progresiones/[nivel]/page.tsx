"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import ChordEarGame from "../../ChordEarGame";
import { findProgressionLevel } from "@/lib/chordEar";

export default function ProgresionesOidoPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findProgressionLevel(nivel);
  if (!level) notFound();

  return <ChordEarGame level={level} backHref="/play/oido/progresiones" />;
}
