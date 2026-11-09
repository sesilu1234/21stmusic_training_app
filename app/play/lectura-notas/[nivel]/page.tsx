"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import NoteReadingGame from "../NoteReadingGame";
import NoteSprintGame from "../NoteSprintGame";
import { findNoteReadingLevel } from "@/lib/noteReading";
import { findNoteSprintLevel } from "@/lib/noteSprint";

export default function LecturaNotasNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);

  const sprint = findNoteSprintLevel(nivel);
  if (sprint) return <NoteSprintGame level={sprint} />;

  const level = findNoteReadingLevel(nivel);
  if (!level) notFound();

  return <NoteReadingGame level={level} />;
}
