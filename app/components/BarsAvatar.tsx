/**
 * El avatar de la cuenta: seis barras de alturas distintas, sacadas del nombre.
 *
 * Sustituye a los animales de [AnimalAvatar]. Aquellos siguen en el repo y no
 * se han tocado — se recuperan cambiando el import de abajo en `UserMenu` —
 * pero se dejan de usar por dos motivos que no son de dibujo:
 *
 *  - Un animal asignado por sorteo se puede leer como un juicio sobre la
 *    persona. Cerdo, conejo, zorro: ninguno es neutro cuando te toca sin
 *    haberlo elegido.
 *  - Convierte el avatar en el tema de conversación. Esto es una app de
 *    estudio; el avatar tiene que identificar y callarse.
 *
 * Las barras no tienen ese problema — no significan nada de nadie — y encima
 * son lo único de todo lo que probamos que además pega con una app de música:
 * se leen como un ecualizador.
 *
 * Sale del nombre, así que cada alumno tiene el suyo y siempre le sale el
 * mismo, sin subir nada ni guardar nada. Se dibuja con un SVG y seis
 * rectángulos: ni imágenes, ni peticiones, ni emojis (que cada sistema pinta a
 * su manera).
 */

import { nameHash } from "@/lib/nameHash";

/**
 * El color NO identifica. Todos los avatares son de la misma familia cálida.
 *
 * Hubo una versión con el tono suelto por el círculo entero — cada nombre, un
 * color — y se descartó por un motivo que no es de diseño: en España la rueda
 * de color está repartida entre partidos. Azul, rojo, verde, morado, naranja:
 * con veinticuatro familias, a alguien le acaba tocando el color de algo, y un
 * avatar que te asignan sin pedirte opinión no es el sitio donde arriesgar eso.
 * Es el mismo problema que echó a los animales, solo que en color.
 *
 * Volviendo al ámbar de la casa el riesgo desaparece, y no porque el ámbar sea
 * más neutro en abstracto, sino porque es el acento que la app ya usa en todas
 * partes: nadie lee el color de una interfaz como una bandera.
 *
 * Lo que se pierde con eso es la variedad, que era el motivo de haber soltado
 * el tono. Se recupera abajo, en la forma: número de barras, grosor, remate y
 * silueta. Cuatro ejes dan de sobra para que dos avatares no se confundan sin
 * tener que tocar el color.
 */

/** De cobre a oro. Es un rango estrecho a propósito: sigue siendo un solo color. */
const HUES = [28, 34, 40, 46];
const SATURATIONS = [62, 72, 82, 92];

/** La barra más corta y la más alta de un mismo avatar. */
const LIGHT_MIN = 52;
const LIGHT_MAX = 76;

/**
 * Cuántas barras. Cinco, seis o siete, según el nombre.
 *
 * El techo es siete y no diez porque el avatar se pinta a 40px dentro de un
 * círculo: con siete, cada barra cae en unos 3px de ancho y todavía se
 * distingue; pasando de ahí es una trama gris. Los otros patrones que probamos
 * (arcos entrelazados, rejilla de secuenciador) se caían justo aquí: preciosos
 * en grande e ilegibles al tamaño en que se usan.
 */
const COUNTS = [5, 6, 7];

/** Barra flaca o barra gorda, dentro de lo que deja el hueco. */
const WIDTHS = [0.44, 0.54, 0.64];

const BOX = 24;
const MAX_H = 22;

/**
 * La altura mínima depende del grosor, no es un número fijo.
 *
 * El remate redondo es media circunferencia por arriba y otra por abajo: en
 * cuanto la barra es más baja que ancha, las dos mitades se tocan y lo que se
 * ve es un punto suelto flotando, no una barra corta. Con la barra flaca daba
 * igual; al abrir los grosores empezó a salir. Con 1,6 todavía salía redonda:
 * hace falta más del doble del ancho para que se lea como una barra corta y no
 * como una mota.
 */
const minHeightFor = (width: number) => Math.max(4.5, width * 2.2);

/**
 * Un flujo de números a partir de la semilla: uno por decisión del avatar.
 *
 * No vale con `hash % algo` cambiando el módulo cada vez: eso reparte mal por el
 * mismo motivo que explica `nameHash` (los bits de abajo apenas dependen del
 * nombre), y salían siluetas parecidas. Cada llamada vuelve a mezclar el estado
 * entero, así que las tiradas son independientes de verdad.
 */
const stream = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state ^ (state >>> 15), 2246822507) ^ 0x9e3779b9) >>> 0;
    return state / 4294967296;
  };
};

/**
 * Las alturas de las barras, ya estiradas para que siempre haya una mínima y
 * una máxima.
 *
 * Sin el estirado, un nombre podía sacar valores parecidos y quedaba un bloque
 * plano, que no identifica nada. Reescalando, la silueta ocupa siempre
 * todo el rango y lo que distingue a un alumno de otro es el perfil, que es
 * justo lo que se ve de un vistazo.
 */
const heightsFor = (next: () => number, count: number, minHeight: number) => {
  const raw = Array.from({ length: count }, next);

  const low = Math.min(...raw);
  const span = Math.max(...raw) - low;

  // Que salgan todas iguales es casi imposible, pero dividir por cero no lo es:
  // si pasa, se queda una fila plana a media altura en vez de romperse.
  if (span === 0) return raw.map(() => (minHeight + MAX_H) / 2);

  return raw.map((value) => minHeight + ((value - low) / span) * (MAX_H - minHeight));
};

export default function BarsAvatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const hash = nameHash(name);

  // Un solo flujo para todo el avatar, y en un orden fijo: cambiar el orden de
  // estas líneas le cambia el dibujo a todo el mundo.
  const next = stream(hash);

  const hue = HUES[Math.floor(next() * HUES.length)];
  const saturation = SATURATIONS[Math.floor(next() * SATURATIONS.length)];
  const count = COUNTS[Math.floor(next() * COUNTS.length)];
  const widthRatio = WIDTHS[Math.floor(next() * WIDTHS.length)];
  // Remate redondo o cuadrado. Es el eje más barato de todos y el que más
  // cambia el carácter: cuadrado se lee a ecualizador de aparato, redondo a
  // onda dibujada.
  const squareCaps = next() < 0.4;

  const pitch = BOX / count;
  const width = pitch * widthRatio;
  const minHeight = minHeightFor(width);

  const heights = heightsFor(next, count, minHeight);

  return (
    <svg viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden focusable="false" className={className}>
      {/* El fondo lleva el mismo tono, muy oscuro y medio desaturado: así la
          baldosa entera pertenece a la misma familia en vez de ser un color
          encima de un gris cualquiera. */}
      <rect width={BOX} height={BOX} fill={`hsl(${hue} 26% 12%)`} />

      {heights.map((height, index) => {
        // La claridad la manda la propia barra: la más alta es la más clara.
        // Atarla a la altura y no al azar hace que la silueta y el color digan
        // lo mismo, y de paso el degradado sale ordenado en vez de moteado.
        const t = (height - minHeight) / (MAX_H - minHeight);
        const light = LIGHT_MIN + t * (LIGHT_MAX - LIGHT_MIN);
        // Un abanico de tono de unos pocos grados a lo ancho: da profundidad
        // sin que la barra del borde parezca de otro color.
        const shift = (index - (count - 1) / 2) * 2.5;

        return (
          <rect
            key={index}
            x={index * pitch + (pitch - width) / 2}
            // Centradas, no apoyadas en el suelo: apoyadas se leen como un
            // gráfico de barras, y centradas como una onda. Además el recorte
            // circular del menú se come las esquinas de abajo, así que lo que va
            // pegado al borde inferior se pierde.
            y={(BOX - height) / 2}
            width={width}
            height={height}
            rx={squareCaps ? 0 : width / 2}
            fill={`hsl(${hue + shift} ${saturation}% ${light}%)`}
          />
        );
      })}
    </svg>
  );
}
