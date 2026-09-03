import type { NextConfig } from "next";

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
    ];
  },

  async redirects() {
    return [
      { source: "/sobre", destination: "/about", permanent: true },
      { source: "/contacto", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
