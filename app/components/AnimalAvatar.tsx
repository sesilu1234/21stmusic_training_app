/**
 * El avatar de la cuenta: un animal en pixel art, elegido con el nombre.
 *
 * Los dibujos están uno por archivo en `./animals`, escritos como una rejilla
 * de caracteres que se lee y se retoca a mano. Van como datos y no como
 * imágenes para que el avatar no dependa de una petición de red ni parpadee al
 * abrir la página.
 *
 * Cada alumno tiene su animal y siempre le sale el mismo, sin subir nada ni
 * guardar nada: sale del nombre. Al haber pocos, dos alumnos pueden compartir
 * animal — da igual, porque cada uno solo ve el suyo.
 *
 * La alternativa que probamos antes está en [Identicon]: un mosaico generado.
 * Para volver a ella basta con cambiar el import en `UserMenu`.
 */

import { nameHash } from "@/lib/nameHash";
import { animalPaths, ANIMALS, GRID } from "./animals";

/** El animal que le toca a un nombre. Siempre el mismo. */
export const animalFor = (name: string) => ANIMALS[nameHash(name) % ANIMALS.length];

export default function AnimalAvatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const animal = animalFor(name);

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      // Sin esto el navegador suaviza los bordes y el pixel art se emborrona.
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Avatar: ${animal.label}`}
      className={className}
    >
      <rect width={GRID} height={GRID} rx="3.5" fill={animal.bg} />
      {animalPaths(animal).map((layer) => (
        <path key={layer.fill} fill={layer.fill} d={layer.d} />
      ))}
    </svg>
  );
}
