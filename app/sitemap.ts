import type { MetadataRoute } from "next";
import { GAMES } from "@/lib/games";
import { SITE_URL } from "@/lib/seo";

/**
 * El mapa del sitio: lo que se le ofrece a un buscador.
 *
 * Sale del catálogo de juegos y no de una lista escrita a mano, para que un
 * modo nuevo aparezca aquí solo. Y por el mismo motivo se filtran los que
 * piden cuenta (`studentsOnly`) y los que todavía no existen (`comingSoon`):
 * ofrecerle a Google una puerta cerrada no ayuda a nadie, y una tarjeta
 * "próximamente" es una página vacía.
 *
 * Los niveles de cada modo NO entran, aunque tengan URL propia. Son la misma
 * pantalla con otro contenido, y meter cien direcciones casi iguales diluye
 * las veinte que sí dicen algo.
 *
 * Aquí va SOLO la URL, y las tres cosas que se han quitado se quitaron por
 * motivos distintos:
 *
 *  · `lastModified` era `new Date()`, o sea la hora de generar el sitemap. Eso
 *    le decía a Google que las veintidós páginas se habían modificado hoy, y se
 *    lo decía otra vez mañana. Google descarta el `lastmod` de un sitio entero
 *    en cuanto ve ese patrón, porque es la firma de una fecha automática. Una
 *    fecha falsa es peor que ninguna: no gana rastreo y quema la credibilidad
 *    del campo. Para ponerla de verdad haría falta saber cuándo cambió cada
 *    página, y eso aquí no se sabe.
 *
 *  · `priority` y `changeFrequency` los ignora Google por completo, y lo dice
 *    él, no es una interpretación. Solo eran dos números que mantener.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paginas = [
    SITE_URL,
    `${SITE_URL}/about`,
    `${SITE_URL}/contact`,
    `${SITE_URL}/privacidad`,
  ];

  const juegos = GAMES.filter((game) => !game.studentsOnly && !game.comingSoon).map(
    (game) => `${SITE_URL}${game.slug}`,
  );

  return [...paginas, ...juegos].map((url) => ({ url }));
}
