import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { chaney } from "./fonts";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "21st Century Music",
  description: "Entrenamiento musical de la escuela 21st Century Music.",
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
