import { ExternalLink } from "lucide-react";
import InfoShell, { InfoSection } from "../components/InfoShell";
import ContactForm from "./ContactForm";
import { SITE } from "@/lib/site";

export const metadata = { title: "Contacto · 21st Century Music" };

export default function ContactoPage() {
  return (
    <InfoShell
      eyebrow="Contacto"
      title="Hablemos"
      intro="Dudas sobre los ejercicios, problemas para entrar, fallos o ideas para modos nuevos. Escribe y te contestamos."
    >
      <ContactForm />

      <InfoSection title="Si es un problema de acceso">
        <p>
          Dinos con qué usuario o correo intentas entrar. Las cuentas las da de alta la academia
          una a una, así que lo más probable es que sea eso.
        </p>
      </InfoSection>

      <InfoSection title="La academia">
        <p>
          Esta app es la herramienta de entrenamiento de {SITE.academyName}. Para clases, horarios,
          matrículas o cualquier cosa que no sea la app, mejor por la web de la escuela.
        </p>
        <a
          href={SITE.academyUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 transition hover:border-amber-300/40 hover:text-white"
        >
          {SITE.academyName}
          <ExternalLink size={14} />
        </a>
      </InfoSection>
    </InfoShell>
  );
}
