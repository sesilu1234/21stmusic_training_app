import {
  Fraunces,
  IBM_Plex_Sans,
  IBM_Plex_Serif,
  Inter,
  Literata,
  Newsreader,
  Outfit,
  Pixelify_Sans,
  Silkscreen,
  Source_Serif_4,
  Space_Grotesk,
} from "next/font/google";
import localFont from "next/font/local";

export const chaney = localFont({
  src: "./fonts/chaney-bold-italic.ttf",
  weight: "700",
  style: "italic",
  variable: "--font-chaney",
});

/**
 * Tipografías de las páginas de información (sobre, contacto, privacidad).
 *
 * Esas tres páginas son solo texto, así que se merecen una serif de verdad en
 * lugar de la sans del resto de la app. Fraunces para los titulares — tiene
 * cursiva y bastante carácter, que es lo que las hace parecer algo escrito y no
 * un formulario — y Newsreader para el cuerpo, que es de leer y no cansa.
 *
 * Next solo descarga la tipografía en las páginas que la usan, así que esto no
 * le cuesta nada a las pantallas de juego.
 */
export const infoDisplay = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-info-display",
});

export const infoBody = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-info-body",
});

/** Las dos, para poner en la raíz de cada página de información. */
export const infoFontVariables = `${infoDisplay.variable} ${infoBody.variable}`;

/**
 * Tipografía de píxel, para los rótulos de contacto. Es la misma que ya usaban
 * los bocetos de los avatares, así que el pixel art de la app y esa página
 * hablan el mismo idioma.
 *
 * Solo para rótulos cortos: es una fuente de mapa de bits y un párrafo entero
 * en Silkscreen no hay quien lo lea. Lo que se escribe va en Geist Mono, que ya
 * viene cargada desde el layout y no cuesta una descarga más.
 */
export const pixelFont = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pixel",
});

/**
 * La pareja de Silkscreen para lo que se escribe en el formulario.
 *
 * También es de píxel, pero de las legibles: tiene minúsculas de altura normal
 * y proporciones de fuente de texto, así que a 13px se lee un correo sin
 * esfuerzo. Silkscreen no vale para esto — a ese tamaño es un jeroglífico — y
 * por eso se queda solo para rótulos de dos palabras.
 */
export const pixelBody = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-pixel-body",
});

/** Las dos, para la raíz de la página de contacto. */
export const pixelFontVariables = `${pixelFont.variable} ${pixelBody.variable}`;

/**
 * Tipografías de la guía. Va aparte del resto de la app a propósito: la guía
 * se lee seguido, así que lleva una serif de lectura para el cuerpo y una
 * sans para títulos y navegación.
 *
 * Hay cuatro parejas para poder compararlas en la propia página. Cuando esté
 * decidida cuál se queda, se borran las otras tres y sus imports: cada una son
 * dos familias más que descargar.
 */

// A — geométrica + serif de pantalla. Moderna y con carácter.
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--type-a-display",
});
export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--type-a-body",
});

// B — la pareja neutra. Inter no molesta y Literata está hecha para leer
//     libros en pantalla; es la opción más "editorial" y menos llamativa.
export const inter = Inter({ subsets: ["latin"], variable: "--type-b-display" });
export const literata = Literata({ subsets: ["latin"], variable: "--type-b-body" });

// C — una sola familia en sus dos versiones. Técnica y muy coherente:
//     es la tipografía con la que están hechos los manuales de IBM.
export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--type-c-display",
});
export const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--type-c-body",
});

// D — la más suelta: Outfit es redonda y actual, Newsreader tiene aire de
//     revista. La que menos parece documentación.
export const outfit = Outfit({ subsets: ["latin"], variable: "--type-d-display" });
export const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--type-d-body",
});

/** Las cuatro, para el selector de la guía. */
export const GUIDE_TYPEFACES = [
  { id: "a", label: "Space Grotesk", pair: "+ Source Serif" },
  { id: "d", label: "Outfit", pair: "+ Newsreader" },
] as const;

export type GuideTypefaceId = (typeof GUIDE_TYPEFACES)[number]["id"];

export const guideFontVariables = [
  spaceGrotesk.variable,
  sourceSerif.variable,
  inter.variable,
  literata.variable,
  plexSans.variable,
  plexSerif.variable,
  outfit.variable,
  newsreader.variable,
].join(" ");
