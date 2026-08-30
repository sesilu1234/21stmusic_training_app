/**
 * El avatar de la cuenta: un mosaico dibujado a partir del nombre.
 *
 * Antes iba la inicial dentro de un círculo y quedaba a medio camino de todo:
 * ni es una foto ni es un icono, y una letra suelta en un círculo se lee como
 * un hueco sin rellenar. Esto sale del nombre, así que cada alumno tiene el
 * suyo y siempre le sale el mismo, sin subir nada ni guardar nada.
 *
 * Se dibuja con un SVG y cuatro cuadrados: ni imágenes, ni peticiones, ni
 * emojis (que cada sistema pinta a su manera). El mismo nombre da el mismo
 * dibujo en cualquier dispositivo.
 */

import { nameHash } from "@/lib/nameHash";

/**
 * Tonos cálidos, todos de la familia del ámbar que ya usa la cuenta. La
 * variedad de verdad está en la forma; el color solo da un punto de "esto es
 * mío" sin salirse de la paleta de la app.
 */
const TONES = ["#fcd34d", "#fdba74", "#fde68a", "#fbbf24"];

const GRID = 5;
/** Solo se sortea media rejilla: la otra mitad es su espejo. */
const HALF = Math.ceil(GRID / 2);

export default function Identicon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const hash = nameHash(name);
  const tone = TONES[hash % TONES.length];

  const cells: { x: number; y: number }[] = [];

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < HALF; x++) {
      // Un bit distinto por casilla. Se vuelve a mezclar en cada una para que
      // nombres parecidos no den dibujos parecidos.
      const bit = Math.imul(hash ^ (y * HALF + x + 1), 2654435761) >>> 0;
      if ((bit >>> 16) % 100 < 48) continue;

      cells.push({ x, y });
      // El espejo, salvo en la columna del centro, que ya está puesta.
      if (x < HALF - 1 || GRID % 2 === 0) {
        cells.push({ x: GRID - 1 - x, y });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      aria-hidden
      focusable="false"
      className={className}
    >
      {cells.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x + 0.06}
          y={y + 0.06}
          width={0.88}
          height={0.88}
          rx={0.16}
          fill={tone}
        />
      ))}
    </svg>
  );
}
