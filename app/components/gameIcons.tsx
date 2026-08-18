import { Activity, Ear, Hash, Headphones, Music, Music2, Target } from "lucide-react";
import type { GameIcon } from "@/lib/games";

export const gameIcons: Record<GameIcon, React.ElementType<{ size?: number; className?: string }>> = {
  Hash,
  Target,
  Headphones,
  Music2,
  Activity,
  Music,
  Ear,
};
