"use client";

import { usePathname } from "next/navigation";
import { backPathFor } from "@/lib/games";

/**
 * El destino de "volver" para la pantalla actual (ver `backPathFor`) y cómo
 * llamarlo: "Menú" si es la portada, "Atrás" si es un submenú.
 */
export function useBackHref() {
  const href = backPathFor(usePathname() ?? "/");
  return { href, label: href === "/" ? "Menú" : "Atrás" };
}
