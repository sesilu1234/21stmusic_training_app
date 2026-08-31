import DustLayer from "./DustLayer";

/**
 * Fondo común de la app.
 *
 * El contraste se consigue sobre todo con el fondo de las tarjetas, no
 * ahogando la foto: por eso el velo es suave. Sube un poco arriba y abajo, que
 * es donde caen la cabecera y el pie.
 *
 * Encima del velo flotan unas motas de polvo, lo justo para que la foto no se
 * quede del todo quieta.
 *
 * Dos cosas que antes estaban aquí y ya no:
 *
 *  - Un `backdrop-blur` de 1.5px. Debajo de un velo al 82% no se veía, y en
 *    móvil salía carísimo: el navegador tiene que releer y desenfocar el fondo
 *    en cada fotograma de scroll, y esta capa ocupa la pantalla entera.
 *  - El velo como clases de React según el modo guardado. El modo se lee de
 *    localStorage, así que el primer pintado salía siempre oscuro y el modo
 *    claro entraba con un parpadeo. Ahora lo elige el CSS a partir del
 *    `data-theme-mode` que el script de `layout.tsx` pone antes de pintar, y de
 *    paso este componente deja de necesitar cliente.
 */
export default function Backdrop() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/*
        La foto, con el desenfoque horneado.

        Es `filter` (blur-[1px]), no `backdrop-filter`. La diferencia es toda:
        `backdrop-filter` desenfoca lo que hay *detrás* del elemento, y como eso
        cambia al hacer scroll, hay que rehacerlo en cada fotograma. `filter`
        desenfoca el contenido propio, que aquí es una imagen quieta dentro de
        una capa `fixed`: se rasteriza una vez y se reutiliza mientras dure la
        página.

        Por eso va en su propia capa y no en el div de fuera: `filter` se aplica
        a todo el subárbol, así que desde el padre alcanzaría también al canvas
        de las motas — y ese sí se repinta 30 veces por segundo, lo que obligaría
        a rehacer un desenfoque de pantalla completa 30 veces por segundo. El
        velo y las motas van encima como hermanos, sin desenfocar.

        `-inset-2` porque el desenfoque toma muestras de más allá del borde, y
        ahí no hay nada: sin el margen se veían los cuatro cantos difuminados
        hacia transparente. El `overflow-hidden` del padre recorta lo que sobra.
      */}
      <div
        className="absolute -inset-2 bg-cover bg-center blur-[1px]"
        style={{ backgroundImage: "url('/assets/background.jpeg')" }}
      />
      <div className="backdrop-veil absolute inset-0" />
      <DustLayer />
    </div>
  );
}
