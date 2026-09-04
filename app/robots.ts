import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Lo que los buscadores pueden mirar y lo que no.
 *
 * OJO, QUE ESTO ES AL REVÉS DE LO QUE PARECE: aquí solo se cierra `/api/`, y
 * las páginas privadas —login, guía, progreso, notas, alumnario, muestrario—
 * se dejan ABIERTAS a propósito, aunque sean justo las que no queremos en
 * Google.
 *
 * El motivo es que "no rastrear" y "no indexar" son cosas distintas y se
 * estorban. Un `Disallow` dice "no entres a leer esa página"; la etiqueta
 * `noindex` que llevan esas páginas en su `metadata` dice "puedes leerla, pero
 * no la guardes". Si se ponen las dos, gana el Disallow: Google no entra, no
 * llega a ver el `noindex`, y como la URL la conoce por otros enlaces, la
 * indexa igual —sin descripción, o con el resumen viejo de antes de cerrarla.
 * Eso es exactamente lo que pasaba: `/login` salía en los resultados como
 * "Acceso · 21st Century Music" pese a estar aquí en la lista de prohibidas.
 *
 * Para que una página SALGA de Google hay que dejarle entrar a leer el
 * `noindex`. Por eso esta lista se ha quedado en `/api/`, que no es HTML y no
 * puede llevar etiqueta ninguna.
 *
 * Esto no es seguridad: un robots.txt es una petición, y quien quiera entrar
 * por la URL entra igual. Lo que protege de verdad son los roles de
 * `lib/roles.ts` y el `notFound()` del alumnario.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Rutas de datos: no son páginas, no pueden declarar `noindex` por su
      // cuenta y no hay nada que enseñar en ellas.
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
