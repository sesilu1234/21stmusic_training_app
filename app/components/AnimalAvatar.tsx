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
import { animalPaths, ANIMALS, VIEW, type Animal } from "./animals";

/** El animal que le toca a un nombre. Siempre el mismo. */
export const animalFor = (name: string) => ANIMALS[nameHash(name) % ANIMALS.length];

/**
 * La baldosa de un animal concreto, sin pasar por el nombre. Va aparte porque
 * el muestrario de `/muestrario` los pinta todos y así no hay dos copias del
 * mismo SVG que puedan acabar diciendo cosas distintas.
 *
 * El `viewBox` es la rejilla más el aire de `PAD` por los cuatro lados; el
 * fondo cubre la caja entera, así que la baldosa sigue llena de color y lo
 * único que queda separado del borde es el dibujo.
 */
export function AnimalTile({
  animal,
  className = "",
}: {
  animal: Animal;
  className?: string;
}) {
  return (
    <svg
      viewBox={`${VIEW.min} ${VIEW.min} ${VIEW.size} ${VIEW.size}`}
      // Sin esto el navegador suaviza los bordes y el pixel art se emborrona.
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Avatar: ${animal.label}`}
      className={className}
    >
      <rect
        x={VIEW.min}
        y={VIEW.min}
        width={VIEW.size}
        height={VIEW.size}
        rx={VIEW.corner}
        fill={animal.bg}
      />
      {animalPaths(animal).map((layer) => (
        <path key={layer.fill} fill={layer.fill} d={layer.d} />
      ))}
    </svg>
  );
}

export default function AnimalAvatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return <AnimalTile animal={animalFor(name)} className={className} />;
}
