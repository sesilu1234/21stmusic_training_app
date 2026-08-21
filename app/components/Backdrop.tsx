"use client";

import DustLayer from "./DustLayer";
import { useStoredThemeMode } from "@/lib/themeMode";

/**
 * Fondo común de la app.
 *
 * El contraste se consigue sobre todo con el fondo de las tarjetas, no
 * ahogando la foto: por eso el desenfoque es mínimo y el velo, suave. Sube un
 * poco arriba y abajo, que es donde caen la cabecera y el pie.
 *
 * Encima del velo flotan unas motas de polvo, lo justo para que la foto no se
 * quede del todo quieta.
 */
export default function Backdrop() {
  const [isDarkMode] = useStoredThemeMode();

  return (
    <div
      className="fixed inset-0 z-0 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/background.jpeg')" }}
    >
      <div
        className={`absolute inset-0 backdrop-blur-[1.5px] ${
          isDarkMode
            ? "bg-gradient-to-b from-slate-950/82 via-slate-950/64 to-slate-950/88"
            : "bg-gradient-to-b from-slate-900/55 via-slate-900/32 to-slate-900/62"
        }`}
      />
      <DustLayer />
    </div>
  );
}
