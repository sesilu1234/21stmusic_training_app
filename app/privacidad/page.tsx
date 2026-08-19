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
          Tu correo y tu nombre para mostrar —y tu foto, si entras con Google—, tus partidas
          terminadas y tus medallas. Si nos escribes por el formulario, también ese mensaje. Nada
          más: ni dirección, ni teléfono, ni pagos, ni micrófono.
        </Item>

        <Item title="Qué no sale de aquí">
          Tus notas y tu preferencia de tema se guardan solo en este dispositivo. No llegan a
          ningún servidor y desaparecen si borras los datos del navegador.
        </Item>

        <Item title="Para qué">
          Para dejarte entrar, enseñarte tu progreso y que el profesorado vea cómo va cada alumno.
          Sin publicidad, sin venta de datos, sin cesiones a terceros.
        </Item>

        <Item title="Quién lo ve">
          El profesorado y la dirección. El resto de alumnos solo ven tu nombre y tus medallas en
          el ranking; tu correo, tus partidas y tus notas, nunca.
        </Item>

        <Item title="Cookies">
          Una cookie técnica para mantener la sesión abierta. Ni rastreo, ni analítica.
        </Item>

        <Item title="Dónde y cuánto">
          En servidores de Supabase; el acceso con Google lo gestiona Google. Mientras tu cuenta
          esté activa como alumno. Al darla de baja, se borra.
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
          Las cuentas de alumnos menores las crea la academia con el consentimiento de sus padres o
          tutores.
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
