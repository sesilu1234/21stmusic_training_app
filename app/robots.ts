import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Lo que los buscadores pueden mirar y lo que no.
 *
 * La regla es sencilla: se indexa lo que sirve a alguien que llega de fuera —la
 * portada y los modos de juego abiertos— y se cierra todo lo que solo tiene
 * sentido habiendo entrado con cuenta. Que la guía esté cerrada no es SEO, es
 * que es material de la escuela para sus alumnos.
 *
 * Esto no es seguridad: un robots.txt es una petición, y quien quiera entrar
 * por la URL entra igual. Lo que protege de verdad son los roles de
 * `lib/roles.ts` y el `notFound()` del alumnario. Esto solo evita que acabe en
 * Google algo que no pinta nada ahí.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",         // nada que enseñar: son rutas de datos
        "/alumnario",    // datos de alumnos
        "/muestrario",   // página de taller
        "/progreso",     // el panel de cada alumno
        "/notas",        // apuntes privados
        "/guia",         // material de la escuela, solo para alumnos con cuenta
        "/login",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
