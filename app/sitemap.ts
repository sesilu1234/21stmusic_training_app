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
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const paginas = [
    { url: SITE_URL, priority: 1, changeFrequency: "weekly" as const },
    { url: `${SITE_URL}/about`, priority: 0.6, changeFrequency: "monthly" as const },
    { url: `${SITE_URL}/contact`, priority: 0.5, changeFrequency: "yearly" as const },
    { url: `${SITE_URL}/privacidad`, priority: 0.2, changeFrequency: "yearly" as const },
  ];

  const juegos = GAMES.filter((game) => !game.studentsOnly && !game.comingSoon).map(
    (game) => ({
      url: `${SITE_URL}${game.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    }),
  );

  return [...paginas, ...juegos].map((pagina) => ({ ...pagina, lastModified: now }));
}
