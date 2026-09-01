/**
 * Lo que se enseña mientras algo carga: tres barras subiendo y bajando.
 *
 * Sustituye al anillo que giraba (`border-t-transparent … animate-spin`), que
 * es el mismo cargador que trae cualquier sitio y no dice nada de esta app.
 * Estas barras son el mismo gesto que el avatar de la cuenta, así que la espera
 * se parece al resto de la casa en vez de parecer una pieza prestada.
 *
 * Es CSS puro, sin JavaScript ni SVG: tres divs con la misma animación y el
 * arranque desplazado. Un cargador no puede costar nada — sale justo cuando el
 * navegador ya está ocupado con otra cosa.
 *
 * `scaleY` y no `height` porque las transformaciones no rehacen el diseño de la
 * página: el navegador las resuelve al pintar. Animar la altura obligaría a
 * recalcular la caja en cada fotograma, y eso es exactamente lo que no se puede
 * gastar mientras se está cargando algo.
 */
export default function LoadingBars({
  className = "",
  label = "Cargando",
}: {
  className?: string;
  /** Lo que oye un lector de pantalla. La animación no le dice nada. */
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center gap-[3px] ${className}`}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="loading-bar block w-[3px] rounded-full bg-current"
          style={{
            height: "100%",
            // Desfasadas: a la vez parecerían un solo bloque latiendo.
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}
