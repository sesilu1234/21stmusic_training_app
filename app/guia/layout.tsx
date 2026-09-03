import type { Metadata } from "next";
import { guideFontVariables } from "@/app/fonts";
import { PRIVADO } from "@/lib/seo";
import StudentsOnlyGate from "@/app/components/StudentsOnlyGate";
import GuideShell from "./GuideShell";

/**
 * La guía es material de la escuela para sus alumnos y está detrás de la puerta
 * de `StudentsOnlyGate`, así que no se indexa. No es una decisión de SEO: sería
 * el único texto largo de la app y lo que más podría posicionar, pero ofrecer
 * en Google una página que luego pide cuenta es prometer algo que no se da.
 */
export const metadata: Metadata = {
  title: "Guía",
  description: "Teoría musical básica explicada por capítulos.",
  robots: PRIVADO,
};

export default function GuiaLayout({ children }: { children: React.ReactNode }) {
  // La guía es material de la escuela, así que va detrás de la misma puerta
  // que los modos de alumnos. No se esconde: el enlace sigue en la barra,
  // apagado y con candado, y aquí se explica por qué no se abre.
  //
  // Las familias tipográficas se declaran en este div; la pareja que se usa
  // la elige `data-type` en GuideShell.
  return (
    <StudentsOnlyGate intro="Esta guía está reservada a los alumnos de 21st Century Music." backLabel="Volver a los juegos">
      <div className={guideFontVariables}>
        <GuideShell>{children}</GuideShell>
      </div>
    </StudentsOnlyGate>
  );
}
