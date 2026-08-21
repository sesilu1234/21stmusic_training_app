import Link from "next/link";
import InfoShell from "../components/InfoShell";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacidad · 21st Century Music" };

export default function PrivacidadPage() {
  return (
    <InfoShell
      eyebrow="Legal"
      title="Privacidad"
      intro={`Actualizado el ${SITE.privacyUpdatedAt}.`}
    >
      <div className="divide-y divide-white/10 border-t border-white/10">
        <Item title="Qué guardamos">
          Nada tuyo mientras juegas: la app no pide cuenta ni te identifica. Solo si nos escribes
          por el formulario guardamos tu correo y tu mensaje, para poder contestarte. Ni dirección,
          ni teléfono, ni pagos, ni micrófono.
        </Item>

        <Item title="Qué no sale de aquí">
          Tus notas, la longitud de partida y tu preferencia de tema se guardan solo en este
          dispositivo. No llegan a ningún servidor y desaparecen si borras los datos del navegador.
        </Item>

        <Item title="Para qué">
          Solo para responder a lo que nos escribas. Sin publicidad, sin venta de datos, sin
          cesiones a terceros.
        </Item>

        <Item title="Quién lo ve">
          El profesorado y la dirección de la academia. Nadie más.
        </Item>

        <Item title="Cookies">
          Ninguna. Ni sesión, ni rastreo, ni analítica.
        </Item>

        <Item title="Dónde y cuánto">
          Los mensajes del formulario, en servidores de Supabase, el tiempo necesario para
          atenderlos.
        </Item>

        <Item title="Tus derechos">
          Puedes acceder a tus datos, corregirlos, borrarlos, limitar su uso, oponerte o pedir una
          copia desde el{" "}
          <Link href="/contacto" className="text-amber-300 underline-offset-4 hover:underline">
            formulario de contacto
          </Link>
          . Si algo no te cuadra, puedes reclamar ante la AEPD.
        </Item>

        <Item title="Menores">
          La app se puede usar sin cuenta y sin dar ningún dato, así que también la pueden usar
          los alumnos menores de edad.
        </Item>
      </div>

      <p className="pt-2 text-xs font-light text-white/30">
        Responsable: {SITE.academyName} ({SITE.name}).
      </p>
    </InfoShell>
  );
}

/**
 * Título a la izquierda, texto a la derecha. Sin tarjetas ni fondos: en una
 * página que solo es texto, las cajas hacían ruido y no ordenaban nada.
 */
function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-6 md:flex md:gap-10">
      <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200/80 md:w-44 md:flex-shrink-0 md:pt-1">
        {title}
      </h2>
      <p className="mt-2.5 max-w-prose text-[15px] font-light leading-7 text-white/65 md:mt-0">
        {children}
      </p>
    </div>
  );
}
