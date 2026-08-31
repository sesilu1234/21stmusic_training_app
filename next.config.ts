import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `/sobre` y `/contacto` pasaron a llamarse `/about` y `/contact`. Estas dos
   * redirecciones son para que no se rompa nada de lo que ya esté circulando:
   * enlaces guardados, algo pegado en un WhatsApp o lo que tenga indexado
   * Google. Permanentes (308) porque el cambio de nombre no tiene vuelta atrás.
   */
  async redirects() {
    return [
      { source: "/sobre", destination: "/about", permanent: true },
      { source: "/contacto", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
