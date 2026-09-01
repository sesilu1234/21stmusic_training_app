import { timingSafeEqual } from "node:crypto";

/**
 * La llave de las páginas internas: el alumnario y el muestrario.
 *
 * No es una cuenta ni un rol, es una clave compartida que va en la URL
 * (`?key=…`). Se ha elegido a propósito por encima de montar permisos de
 * verdad: son dos páginas que mira el profesor de vez en cuando, y añadir un
 * campo `role` a la tabla de alumnos, con su interfaz para asignarlo, es mucha
 * maquinaria para eso. Si algún día hay más de una persona con acceso, o hace
 * falta saber QUIÉN miró qué, entonces sí toca hacerlo bien.
 *
 * Lo que implica usar la URL, y conviene tener claro: la clave queda en el
 * historial del navegador y se iría en el `Referer` si desde aquí se pinchara
 * un enlace externo. Por eso estas páginas no enlazan a ningún sitio de fuera
 * y van marcadas como no indexables.
 */
const KEY = process.env.STAFF_KEY;

/**
 * Compara sin filtrar el tiempo que tarda.
 *
 * Un `===` normal corta en la primera letra distinta, y con suficientes
 * intentos ese tiempo dice por dónde va la clave. Aquí no es un riesgo serio
 * —hace falta muchísimo tráfico para medirlo por internet—, pero comparar bien
 * son tres líneas y así no hay que volver a pensarlo.
 */
export const isStaffKey = (value: unknown) => {
  // Sin clave configurada no entra nadie. Falla cerrado y no abierto: a un
  // despliegue al que se le olvide la variable le toca quedarse fuera, no
  // publicar los datos de los alumnos.
  if (!KEY) return false;

  const given = Buffer.from(String(value ?? ""));
  const expected = Buffer.from(KEY);

  // timingSafeEqual revienta si las longitudes no coinciden, así que eso se
  // mira antes. La longitud sí se filtra, y da igual.
  if (given.length !== expected.length) return false;

  return timingSafeEqual(given, expected);
};

/** Los metadatos que llevan todas las páginas internas. */
export const INTERNAL_METADATA = {
  robots: { index: false, follow: false },
} as const;
