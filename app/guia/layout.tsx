import { guideFontVariables } from "@/app/fonts";
import StudentsOnlyGate from "@/app/components/StudentsOnlyGate";
import GuideShell from "./GuideShell";

export const metadata = {
  title: "Guía · 21st Century Music",
  description: "Teoría musical básica explicada por capítulos.",
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
