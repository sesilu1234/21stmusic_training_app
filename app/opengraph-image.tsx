import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * La tarjeta que sale al pegar el enlace de la app en WhatsApp, Instagram,
 * Twitter o donde sea.
 *
 * Es, con diferencia, la parte de todo esto que más se va a notar: el tráfico
 * de la app no viene de una búsqueda a puerta fría, viene de que alguien de la
 * escuela pasa el enlace. Hasta ahora ese enlace salía pelado, sin imagen y sin
 * nada que dijera qué es.
 *
 * Se dibuja aquí en vez de ser un .png hecho a mano para que si cambia el
 * nombre o los colores no haya que acordarse de reexportar una imagen: se
 * genera en la compilación y ya está.
 */

export const alt =
  "21st Century Music · ejercicios de oído, lectura, ritmo, guitarra y piano";

/** El tamaño que piden todas las redes para la tarjeta grande. */
export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default async function Image() {
  // La misma tipografía de los titulares de la app. Se lee del disco porque
  // aquí no hay CSS: esto no es una página, es un dibujo.
  const chaney = await readFile(
    join(process.cwd(), "app/fonts/chaney-bold-italic.ttf"),
  );

  /*
    El logo de la escuela, de fondo.

    Es una copia recortada y reducida (700px, paleta de 128 colores) del que
    está en public/assets, no el original: aquel pesa 1,7 MB y aquí la imagen
    no se enlaza, se INCRUSTA en el dibujo. Un logo de 70 KB o uno de 1,7 MB se
    ven exactamente igual a este tamaño; lo que cambia es lo que tarda en
    generarse la tarjeta.

    Se pasa como data URI porque el dibujo no tiene servidor delante: no puede
    pedir "/assets/algo", solo llevar la imagen dentro.
  */
  const logo = await readFile(join(process.cwd(), "app/og-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          backgroundColor: "#020617",
          // El mismo halo ámbar del modal de pleno: es el color con el que la
          // app celebra las cosas, así que es el que la representa.
          backgroundImage:
            "radial-gradient(circle at 82% 18%, rgba(251,191,36,0.20), transparent 55%)",
        }}
      >
        {/*
          El logo, grande y apagado, saliéndose por el borde derecho. Va como
          fondo y no como una pieza más de la composición: al tamaño en el que
          WhatsApp enseña esta tarjeta, un logo pequeño y bien colocado no se
          distingue de una mancha, y uno grande y apagado sí se reconoce.

          El texto se queda a la izquierda, sobre la parte donde el logo ya casi
          no está, para que se siga leyendo entero.
        */}
        <img
          src={logoSrc}
          width={780}
          height={568}
          alt=""
          style={{
            position: "absolute",
            right: -150,
            top: 62,
            opacity: 0.2,
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(251,191,36,0.85)",
            fontWeight: 700,
          }}
        >
          Escuela de Música Moderna
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontFamily: "Chaney",
            fontSize: 106,
            lineHeight: 1,
            color: "#ffffff",
            letterSpacing: -4,
          }}
        >
          21st Century Music
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 34,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.62)",
            maxWidth: 780,
          }}
        >
          Tu gimnasio musical interactivo: oído, ritmo, lectura, guitarra y
          piano desde el navegador
        </div>

        <div style={{ display: "flex", marginTop: 50, gap: 14 }}>
          {["#fbbf24", "#a78bfa", "#34d399", "#fb7185"].map((color) => (
            <div
              key={color}
              style={{
                width: 62,
                height: 10,
                borderRadius: 999,
                backgroundColor: color,
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Chaney", data: chaney, weight: 700, style: "italic" }],
    },
  );
}
