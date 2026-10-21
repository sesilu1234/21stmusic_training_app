"use client";

import { useEffect, useState } from "react";
import { getLevelMedals } from "@/app/progreso/actions";

/**
 * La ruta con la que se guarda un nivel, a partir del enlace de su tarjeta.
 *
 * Casi siempre es el propio enlace, sin lo que vaya detrás del `?` (los
 * intervalos elegidos a mano en /play/oido, por ejemplo). Un `?nivel=` se
 * guarda como "/nivel-N".
 */
const savedPathOf = (href: string) => {
  const [path, query = ""] = href.split("?");
  const nivel = new URLSearchParams(query).get("nivel");
  return (nivel ? `${path}/nivel-${nivel}` : path).replace(/\/+$/, "");
};

/**
 * Qué tarjetas de un submenú llevan medalla. Devuelve una función que, dado el
 * enlace de una tarjeta, dice si tiene pleno.
 *
 * Una tarjeta que no es un nivel sino un grupo de ellos (Nombrar, en acordes
 * en el pentagrama) la lleva cuando los tiene todos.
 *
 * Se pide al montar y no viene del servidor con la página porque los submenús
 * son de cliente. Mientras llega, ninguna tarjeta lleva medalla.
 */
export function useLevelMedals() {
  const [data, setData] = useState<{ medals: Set<string>; levels: string[] }>({
    medals: new Set(),
    levels: [],
  });

  useEffect(() => {
    let alive = true;
    getLevelMedals()
      .then(({ medals, levels }) => {
        if (alive) setData({ medals: new Set(medals), levels });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (href: string) => {
    const path = savedPathOf(href);
    if (data.medals.has(path)) return true;
    const inside = data.levels.filter((level) => level.startsWith(`${path}/`));
    return inside.length > 0 && inside.every((level) => data.medals.has(level));
  };
}
