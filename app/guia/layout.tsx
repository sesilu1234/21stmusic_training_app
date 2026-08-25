import { guideFontVariables } from "@/app/fonts";
import GuideShell from "./GuideShell";

export const metadata = {
  title: "Guía · 21st Century Music",
  description: "Teoría musical básica explicada por capítulos.",
};

export default function GuiaLayout({ children }: { children: React.ReactNode }) {
  // Las ocho familias (cuatro parejas) se declaran aquí; la que se usa la
  // elige `data-type` en GuideShell.
  return (
    <div className={guideFontVariables}>
      <GuideShell>{children}</GuideShell>
    </div>
  );
}
