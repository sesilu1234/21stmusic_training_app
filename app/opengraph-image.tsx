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
          position: "relative",
          backgroundColor: "#020617",
        }}
      >
        {/*
          El fondo va por capas y en este orden, que importa: primero la luz,
          luego el logo, luego una cortina oscura por encima del logo. Así el
          logo no está "puesto al 20% y a ver qué sale", sino que emerge de la
          oscuridad por la derecha y se apaga solo antes de llegar al texto.

          Antes el logo cruzaba por detrás del título y las dos cosas se
          estorbaban: el título perdía contraste y el logo no se reconocía.
        */}

        {/* La luz ámbar, detrás del logo y no en una esquina cualquiera: es lo
            que hace que el metal del logo se vea iluminado y no plano. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage:
              "radial-gradient(circle at 74% 46%, rgba(251,191,36,0.34), rgba(251,146,60,0.10) 40%, transparent 66%)",
          }}
        />

        <img
          src={logoSrc}
          width={860}
          height={626}
          alt=""
          style={{
            position: "absolute",
            right: -170,
            top: 22,
            opacity: 0.62,
          }}
        />

        {/* La cortina. De negro sólido a transparente: la mitad izquierda queda
            limpia para el texto y el logo sólo asoma por la derecha. Es lo que
            hace que se pueda subir la opacidad del logo sin que estorbe. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage:
              "linear-gradient(90deg, #020617 0%, #020617 38%, rgba(2,6,23,0.93) 55%, rgba(2,6,23,0.55) 75%, rgba(2,6,23,0.22) 100%)",
          }}
        />

        {/* Viñeta: oscurece arriba y abajo para que la tarjeta tenga suelo y no
            se vea como un rectángulo plano recortado. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage:
              "linear-gradient(180deg, rgba(2,6,23,0.55) 0%, transparent 28%, transparent 62%, rgba(2,6,23,0.75) 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "0 90px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "rgba(251,191,36,0.9)",
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
              fontSize: 96,
              lineHeight: 1,
              color: "#ffffff",
              letterSpacing: -3,
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
              color: "rgba(255,255,255,0.68)",
              maxWidth: 700,
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
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Chaney", data: chaney, weight: 700, style: "italic" }],
    },
  );
}
