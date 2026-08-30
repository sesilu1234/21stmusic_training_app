import StudentsOnlyGate from "./StudentsOnlyGate";
import { isStudentsOnlyLevel } from "@/lib/games";

/**
 * Puerta de un NIVEL suelto dentro de un modo abierto.
 *
 * `StudentsOnlyGate` cierra una carpeta entera y vale para los modos que son
 * de alumnos de arriba abajo. Esto es para los modos que se pueden probar sin
 * cuenta pero cuyos niveles avanzados no: se pone como `layout.tsx` de la
 * carpeta `[nivel]` y mira, nivel a nivel, qué dice `LEVEL_ACCESS`.
 *
 * Como todos los demás, la comprobación pasa en el servidor: el juego es
 * cliente y no se entera de nada.
 */
export default async function LevelGate({
  gameSlug,
  levelSlug,
  children,
}: {
  /** Slug del modo, tal cual está en el catálogo: "/play/ritmo". */
  gameSlug: string;
  /** El trozo de ruta que identifica el nivel: "modulo3". */
  levelSlug: string;
  children: React.ReactNode;
}) {
  if (!isStudentsOnlyLevel(gameSlug, levelSlug)) return <>{children}</>;

  return (
    <StudentsOnlyGate
      backHref={gameSlug}
      backLabel="Ver los otros niveles"
      intro="Este nivel está reservado a los alumnos de 21st Century Music."
    >
      {children}
    </StudentsOnlyGate>
  );
}
