import type { NextConfig } from "next";

/**
 * El dominio de verdad y el que reparte Vercel.
 *
 * Vercel le pone a cada proyecto una dirección `*.vercel.app` que sirve la
 * misma app que el dominio bueno. Para Google eso son dos webs idénticas, y
 * acabó indexando las dos: buscando la escuela salían resultados apuntando a
 * `21stmusic-training-app.vercel.app`, que ni es la marca ni es lo que se
 * quiere enseñar. Abajo se arregla de dos maneras distintas y a propósito.
 */
const VERCEL_ALIAS = "21stmusic-training-app.vercel.app";
const DOMINIO = "https://www.21stcenturymusic.app";

/** Escapa los puntos: el `value` de un `has` es una expresión regular. */
const comoRegex = (host: string) => host.replace(/\./g, "\\.");

const nextConfig: NextConfig = {
  /**
   * `/sobre` y `/contacto` pasaron a llamarse `/about` y `/contact`. Estas dos
   * redirecciones son para que no se rompa nada de lo que ya esté circulando:
   * enlaces guardados, algo pegado en un WhatsApp o lo que tenga indexado
   * Google. Permanentes (308) porque el cambio de nombre no tiene vuelta atrás.
   */
  /**
   * Que nadie pueda meter esta web dentro de un <iframe> en la suya.
   *
   * El ataque que esto para se llama clickjacking: alguien monta una pagina
   * cualquiera, mete 21stcenturymusic.app dentro de un marco invisible o casi
   * transparente, y encima coloca sus propios botones. El visitante cree que
   * pulsa lo que ve, pero el clic lo recibe la app de debajo — y si esa persona
   * tiene la sesion abierta, el clic va con su sesion. La otra version, mas
   * tonta pero mas probable aqui, es simplemente enmarcar la app en otra web y
   * hacerla pasar por propia.
   *
   * Van las dos cabeceras a proposito y dicen lo mismo:
   *
   *   · `frame-ancestors 'none'` es la moderna, la que de verdad miran los
   *     navegadores de hoy. Es una directiva de CSP, pero solo esa: no se pone
   *     una CSP entera porque el layout lleva un <script> en linea (el que
   *     pinta el tema claro/oscuro antes de que React arranque) y una CSP mal
   *     ajustada lo bloquearia y rompeeria la pagina sin avisar.
   *
   *   · `X-Frame-Options: DENY` es la vieja, que ya nadie necesita salvo
   *     navegadores antiguos. No estorba y cuesta una linea.
   *
   * `source: "/:path*"` = todas las rutas.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      /**
       * Que no se indexe NADA de lo que se sirva por un `*.vercel.app`.
       *
       * Esto cubre las vistas previas: cada rama y cada despliegue tienen su
       * propia dirección de Vercel, y son copias enteras de la web con textos
       * a medio hacer. La de producción, además, se redirige (abajo), así que
       * en la práctica esta cabecera es la red para las demás.
       *
       * Va como cabecera y no como `Disallow` en el robots.txt por el mismo
       * motivo que se explica en `app/robots.ts`: prohibir el rastreo no
       * despinta de Google lo que ya esté dentro; `noindex` sí, pero hay que
       * dejar entrar a leerlo.
       */
      {
        source: "/:path*",
        has: [{ type: "host", value: ".*\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/sobre", destination: "/about", permanent: true },
      { source: "/contacto", destination: "/contact", permanent: true },
      /**
       * La dirección de Vercel de producción manda al dominio de verdad.
       *
       * Es la forma fuerte de quitar el duplicado: un 308 no solo saca de
       * Google las URLs de `vercel.app`, sino que le pasa al dominio bueno lo
       * que hubieran acumulado. La etiqueta canónica del layout ya lo pedía,
       * pero una canónica es una sugerencia y esto no.
       *
       * El host va exacto y no como `*.vercel.app` a propósito: las vistas
       * previas de cada rama también son `.vercel.app` y tienen que seguir
       * abriéndose, o no habría manera de probar nada antes de publicarlo.
       * Para esas está la cabecera `X-Robots-Tag` de arriba.
       */
      {
        source: "/:path*",
        has: [{ type: "host", value: comoRegex(VERCEL_ALIAS) }],
        destination: `${DOMINIO}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
