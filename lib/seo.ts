import type { Metadata } from "next";
import { GAMES } from "./games";

/**
 * La dirección del sitio, sin barra final.
 *
 * Sale de una variable de entorno para que en una vista previa de Vercel las
 * URLs absolutas no apunten a producción, pero con el dominio de verdad como
 * valor por defecto: sin él, un despliegue al que se le olvide la variable
 * generaría un sitemap con enlaces rotos, que es peor que no tener sitemap.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://21stcenturymusic.app"
).replace(/\/+$/, "");

/**
 * Lo que se le dice a los buscadores de una página que no es para ellos.
 *
 * `follow: false` además de `index: false` porque estas páginas enlazan a otras
 * privadas: no basta con que no se guarde esta, es que no hay que ir por ahí.
 */
export const PRIVADO: Metadata["robots"] = { index: false, follow: false };

/**
 * Título y descripción de un modo de juego, sacados del catálogo.
 *
 * Existe para no escribir a mano el mismo texto en veinte sitios y que luego
 * el menú y el buscador digan cosas distintas del mismo juego: `lib/games.ts`
 * ya tiene el nombre y la frase de cada modo, y son exactamente los dos textos
 * que hacen falta aquí.
 *
 * Hasta ahora los veinte modos compartían el título de la app, así que para
 * Google eran la misma página repetida veinte veces y ninguna se podía
 * encontrar por lo que es.
 */
export const gameMetadata = (slug: string): Metadata => {
  const game = GAMES.find((item) => item.slug === slug);
  if (!game) return {};

  const url = `${SITE_URL}${slug}`;

  return {
    title: game.label,
    description: `${game.desc} Ejercicio de la app de entrenamiento musical de 21st Century Music.`,
    alternates: { canonical: url },
    // Los modos que piden cuenta no tienen nada que enseñar a quien llegue de
    // fuera: se les cierra la puerta en vez de ofrecerla.
    robots: game.studentsOnly ? PRIVADO : undefined,
    /**
     * La imagen se nombra a mano, y hay que hacerlo.
     *
     * `app/opengraph-image.tsx` se engancha sola en las páginas que NO declaran
     * `openGraph`, pero en cuanto una lo declara —como esta, que quiere su
     * propio título— sustituye el bloque entero del layout raíz y se lleva la
     * imagen por delante. Se comprobó pidiendo la página: la portada traía
     * `og:image` y un modo de juego no.
     *
     * La ruta es la del propio fichero de arriba, y sale absoluta gracias al
     * `metadataBase` del layout raíz.
     */
    openGraph: {
      type: "website",
      url,
      title: `${game.label} · 21st Century Music`,
      description: game.desc,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.label} · 21st Century Music`,
      description: game.desc,
      images: ["/opengraph-image"],
    },
  };
};
