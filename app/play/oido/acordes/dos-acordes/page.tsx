"use client";

import ChordPairGame from "./ChordPairGame";
import { PAIR_LEVELS } from "@/lib/chordPair";

export default function DosAcordesPage() {
  return <ChordPairGame level={PAIR_LEVELS[0]} backHref="/play/oido/acordes" />;
}
