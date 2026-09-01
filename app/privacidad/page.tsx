import Link from "next/link";
import PaperShell, { DISPLAY_FONT } from "../components/PaperShell";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacidad · 21st Century Music" };

/**
 * La versión corta, que es la única que lee alguien.
 *
 * Estuvo un tiempo titulada "No guardamos casi nada", con cada punto abriendo
 * en negación — ni teléfono, ni pagos, ni micrófono. Insistir tanto en lo que
 * no se hace sonaba a descargo, y además ya no era cierto: desde que hay
 * cuentas, las partidas y los apuntes están en la base de datos. Ahora se
 * cuenta lo que hay, ordenado por si has entrado o no, y sin dar ninguna
 * palmadita en la espalda.
 *
 * Lo que no se quita, porque no es decoración sino lo que el RGPD exige que
 * aparezca: quién responde, qué se guarda, para qué, qué derechos tienes y ante
 * quién reclamar.
 */
export default function PrivacidadPage() {
  return (
    <PaperShell>
      <header className="mb-10 md:mb-12">
        <h1
          className="text-2xl leading-tight tracking-tight text-white md:text-3xl"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          Privacidad
        </h1>
      </header>

      <div className="space-y-6 text-[15px] leading-7 text-white/70 md:text-base md:leading-8">
        <p>
          <Lead>Sin cuenta.</Lead> Puedes usar los ejercicios sin registrarte. En
          ese caso no sale nada de tu navegador: no se guardan las partidas ni
          hay nada que asociar a ti. Lo único que queda en el dispositivo es si
          prefieres el tema claro o el oscuro.
        </p>

        <p>
          <Lead>Con cuenta.</Lead> Al entrar como alumno guardamos lo justo para
          que el progreso te siga de un dispositivo a otro: tu nombre y tu
          correo, las partidas terminadas, las medallas, los apuntes que
          escribes y los instrumentos de tu perfil.
        </p>

        <p>
          <Lead>Quién ve qué.</Lead> El profesorado puede consultar cómo llevas
          los ejercicios: partidas, aciertos y medallas. Tus apuntes no salen
          ahí: son tuyos y no hay ninguna pantalla que se los enseñe a nadie
          más. Escribe con la misma confianza que en una libreta.
        </p>

        <p>
          <Lead>Si nos escribes.</Lead> Del formulario de contacto guardamos tu
          correo y tu mensaje, y sirven para contestarte. No pedimos teléfono ni
          dirección, no hay pagos y la app no usa el micrófono.
        </p>

        <p>
          <Lead>Cookies.</Lead> Solo la de sesión, y solo mientras tienes la
          sesión abierta: es lo que hace que no tengas que volver a entrar en
          cada página. No hay analítica, ni publicidad, ni rastreo, ni datos
          cedidos a terceros.
        </p>

        <p>
          <Lead>Puedes pedirnos lo que quieras.</Lead> Ver, corregir o borrar lo
          que tengamos, cuando te apetezca, desde{" "}
          <Link
            href="/contact"
            className="text-amber-300/90 underline decoration-amber-300/30 underline-offset-4 transition hover:decoration-amber-300"
          >
            contacto
          </Link>
          . Si se borra la cuenta, se van con ella las partidas, las medallas y
          los apuntes. Y si algo no te cuadra, puedes reclamar ante la AEPD.
        </p>
      </div>

      <div className="mt-14 space-y-2.5 md:mt-16">
        <div aria-hidden className="h-px w-10 bg-white/10" />
        <p className="text-[13px] leading-6 text-white/30">
          Responsable: {SITE.academyName} ({SITE.name}). Los datos de las cuentas
          y los mensajes del formulario se guardan en servidores de Supabase el
          tiempo necesario para atenderlos.
          <br />
          Actualizado el {SITE.privacyUpdatedAt}.
        </p>
      </div>
    </PaperShell>
  );
}

/** La frase que abre cada punto, en cursiva y más clara que el resto. */
function Lead({ children }: { children: React.ReactNode }) {
  return (
    <strong className="font-normal italic text-white/90" style={{ fontFamily: DISPLAY_FONT }}>
      {children}
    </strong>
  );
}
