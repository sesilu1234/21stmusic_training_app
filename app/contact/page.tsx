import PaperShell, { PaperTitle } from "../components/PaperShell";
import ContactForm from "./ContactForm";

export const metadata = { title: "Contacto · 21st Century Music" };

export default function ContactPage() {
  return (
    <PaperShell>
      <PaperTitle eyebrow="Contacto">Escríbenos</PaperTitle>

      <p className="mb-14 text-2xl leading-10 text-white/70 md:text-[26px] md:leading-[1.7]">
        Un fallo, una idea, una duda de un ejercicio. Lo leemos todo, y casi
        siempre contestamos el mismo día.
      </p>

      <ContactForm />
    </PaperShell>
  );
}
