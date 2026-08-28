import {
  ArrowUpDown,
  BookOpen,
  Drum,
  Ear,
  Grip,
  Guitar,
  Hash,
  Layers,
  Lightbulb,
  ListMusic,
  Mic,
  Music2,
  Piano,
  Waypoints,
} from "lucide-react";
import type { GameIcon } from "@/lib/games";

export const gameIcons: Record<GameIcon, React.ElementType<{ size?: number; className?: string }>> = {
  Hash,
  Waypoints,
  ArrowUpDown,
  Drum,
  Guitar,
  Grip,
  Ear,
  Layers,
  ListMusic,
  Piano,
  Lightbulb,
  Music2,
  Mic,
  BookOpen,
};
