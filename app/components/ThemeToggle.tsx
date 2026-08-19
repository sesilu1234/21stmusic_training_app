"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useStoredThemeMode } from "@/lib/themeMode";

/**
 * Sol y luna cruzándose: el que entra gira y crece, el que sale gira y se va.
 * Los dos ocupan la misma celda del grid, así que el botón no da saltos.
 * Cada uno lleva su color (ámbar el sol, índigo la luna) para que el estado se
 * lea de un vistazo sin tener que leer la etiqueta.
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
          ? "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
          : "group grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:border-amber-300/40 hover:bg-white/10"
      }
    >
      <span className="grid place-items-center">
        <MoonStar
          size={16}
          strokeWidth={1.75}
          className={`${iconClass(isDarkMode)} text-indigo-300 drop-shadow-[0_0_6px_rgba(129,140,248,0.55)]`}
        />
        <SunMedium
          size={17}
          strokeWidth={1.75}
          className={`${iconClass(!isDarkMode)} text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]`}
        />
      </span>
      {withLabel && (
        <span className={isDarkMode ? "text-indigo-200" : "text-amber-200"}>
          {isDarkMode ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
