"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import PianoNoteGame from "../PianoNoteGame";
import { findPianoNoteLevel } from "@/lib/pianoNotes";

export default function PianoNotasNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findPianoNoteLevel(nivel);
  if (!level) notFound();

  return <PianoNoteGame level={level} />;
}
