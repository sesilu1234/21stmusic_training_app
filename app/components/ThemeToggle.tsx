"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useStoredThemeMode } from "@/lib/themeMode";

/**
 * Sol y luna cruzándose: el que entra gira y crece, el que sale gira y se va.
 * Los dos ocupan la misma celda del grid, así que el botón no da saltos.
 */
export default function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const [isDarkMode, setIsDarkMode] = useStoredThemeMode();

  const iconClass = (visible: boolean) =>
    `col-start-1 row-start-1 transition-all duration-500 ease-out ${
      visible ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
    }`;

  return (
    <button
      type="button"
      onClick={() => setIsDarkMode(!isDarkMode)}
      aria-label={isDarkMode ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className={
        withLabel
          ? "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
          : "grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-amber-300 transition hover:border-amber-300/40 hover:bg-white/10"
      }
    >
      <span className="grid place-items-center">
        <MoonStar size={16} className={iconClass(isDarkMode)} strokeWidth={1.75} />
        <SunMedium size={17} className={iconClass(!isDarkMode)} strokeWidth={1.75} />
      </span>
      {withLabel && <span>{isDarkMode ? "Tema oscuro" : "Tema claro"}</span>}
    </button>
  );
}
