"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import IntervalosGame from "../IntervalosGame";
import { findStaffIntervalLevel } from "@/lib/staffIntervals";

export default function IntervalosNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = use(params);
  const level = findStaffIntervalLevel(nivel);
  if (!level) notFound();

  return <IntervalosGame level={level} />;
}
