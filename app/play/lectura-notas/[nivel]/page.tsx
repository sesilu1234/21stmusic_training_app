"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import NoteReadingGame from "../NoteReadingGame";
import { findNoteReadingLevel } from "@/lib/noteReading";

export default function LecturaNotasNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findNoteReadingLevel(nivel);
  if (!level) notFound();

  return <NoteReadingGame level={level} />;
}
