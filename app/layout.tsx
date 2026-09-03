import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { chaney } from "./fonts";
import { SITE_URL } from "@/lib/seo";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  /**
   * Sin esto, cualquier campo de metadatos con una ruta relativa —la imagen que
   * sale al compartir, sin ir más lejos— rompe la compilación, porque una
   * tarjeta de WhatsApp no puede llevar un "/algo": necesita la dirección
   * entera. Puesto aquí, vale para todas las páginas de la app.
   */
  metadataBase: new URL(SITE_URL),

  title: {
    default: "21st Century Music · Entrenamiento musical",
    /**
     * Cada página pone solo lo suyo ("Lectura de notas") y el sufijo lo añade
     * esto. Antes las veinte pantallas de juego compartían el mismo título, y
     * para un buscador eso son veinte copias de la misma página: ninguna se
     * podía encontrar por lo que era.
     */
    template: "%s · 21st Century Music",
  },
  description:
    "Tu gimnasio musical interactivo de la escuela 21st Century Music: " +
    "oído, ritmo, lectura, guitarra y piano desde el navegador.",

  applicationName: "21st Century Music",
  alternates: { canonical: SITE_URL },
  keywords: [
    "entrenamiento musical",
    "ejercicios de oído",
    "lectura de notas",
    "intervalos",
    "acordes",
    "lenguaje musical",
    "escuela de música",
  ],

  // La tarjeta que se ve al pegar el enlace en WhatsApp, Instagram o Twitter.
  // La imagen no se nombra aquí: la coge sola de app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: "21st Century Music",
    locale: "es_ES",
    url: SITE_URL,
    title: "21st Century Music · Entrenamiento musical",
    description:
      "Tu gimnasio musical interactivo: oído, ritmo, lectura, guitarra y piano desde el navegador.",
  },
  twitter: {
    card: "summary_large_image",
    title: "21st Century Music · Entrenamiento musical",
    description:
      "Tu gimnasio musical interactivo: oído, ritmo, lectura, guitarra y piano desde el navegador.",
  },

  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  manifest: "/manifest.webmanifest",
};

/**
 * El color de la barra del navegador en el móvil. Va aparte de `metadata`
 * porque `themeColor` dentro de los metadatos está obsoleto desde Next 14.
 *
 * Dos valores porque la app tiene modo claro y oscuro: el navegador elige el
 * que toque en vez de dejar una barra oscura pegada a una página clara.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `suppressHydrationWarning` es obligatorio aquí, no es para callar un aviso
    // molesto: el script de abajo le pone `data-theme-mode` a este mismo <html>
    // antes de que React hidrate, y React, al encontrarse un atributo que él no
    // ha renderizado, lo borra. Sin esto, quien tuviera el modo claro guardado
    // veía la página oscura y el botón de tema se quedaba desincronizado (creía
    // estar en claro, así que el primer clic no cambiaba nada).
    //
    // Solo afecta a los atributos de <html>, no a lo que hay dentro.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${chaney.variable} h-full antialiased`}
    >
      <head>
        {/*
          El modo claro/oscuro vive en localStorage, que solo existe en el
          navegador: el HTML del servidor no puede saberlo. Sin esto, la primera
          pintura salía siempre oscura y quien tuviera el modo claro veía un
          parpadeo al hidratar.

          Va inline y en el <head> a propósito, para que corra antes de que el
          navegador pinte nada. El try/catch es por si localStorage está
          bloqueado (modo incógnito con cookies desactivadas): en ese caso se
          queda el oscuro, que es el valor por defecto de siempre.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('21st_theme_mode')==='light'){document.documentElement.dataset.themeMode='light'}}catch(e){}",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        {/*
          Vercel Analytics: cuántas visitas y a qué páginas. No pone cookies ni
          identifica a nadie, que con alumnos menores de edad es justo el
          motivo de no haber puesto Google Analytics. Lo que hace la gente
          DENTRO de un juego no se mide aquí: eso está en `game_attempts`.
        */}
        <Analytics />
      </body>
    </html>
  );
}
