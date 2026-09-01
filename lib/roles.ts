import type { Student, StudentRole } from "./students";

/**
 * Quién puede ver qué.
 *
 * Antes esto era una clave compartida en la URL (`?key=…`). Se ha quitado: la
 * clave se quedaba en el historial del navegador, había que pasársela a mano a
 * quien la necesitara y no dejaba saber quién había mirado qué. Ahora sale del
 * rol de la cuenta, que ya está identificada al entrar.
 *
 * Las dos reglas viven aquí y no repartidas por las páginas, porque cada una se
 * usa en dos sitios —la página y el menú que enlaza a ella— y tienen que decir
 * lo mismo en los dos. Un menú que enseña un enlace a una página que luego
 * responde "no existe" es peor que no tener el enlace.
 */

/** El alumnario: ver la actividad de cualquier alumno. */
export const canSeeAlumnario = (role: StudentRole | undefined) =>
  role === "admin" || role === "profesor";

/**
 * El muestrario: la página de trabajo con los avatares y los iconos.
 *
 * Solo admin. No enseña datos de nadie, pero es una página de taller y no
 * pinta nada en el menú de quien da clase.
 */
export const canSeeMuestrario = (role: StudentRole | undefined) => role === "admin";

/** Lo que se lee en el desplegable debajo del nombre. */
export const roleLabel = (role: StudentRole) =>
  role === "admin"
    ? "Administración"
    : role === "profesor"
      ? "Profesorado"
      : "Alumno de la escuela";

/** Atajo para las páginas: el alumno de la sesión, o nadie. */
export const roleOf = (student: Student | null | undefined) => student?.role;
