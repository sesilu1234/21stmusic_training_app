"use client";

import ChordPairGame from "../dos-acordes/ChordPairGame";
import { PAIR_LEVELS } from "@/lib/chordPair";

export default function DosAcordesVariablePage() {
  return <ChordPairGame level={PAIR_LEVELS[1]} backHref="/play/oido/acordes" />;
}
