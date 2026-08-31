import Link from "next/link";
import PaperShell, { DISPLAY_FONT, PaperTitle } from "../components/PaperShell";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacidad · 21st Century Music" };

/**
 * La versión corta, que es la única que lee alguien.
 *
 * Antes eran ocho apartados con epígrafes legales. Leídos de golpe daban la
 * impresión contraria a la real: parecía que aquí se recoge muchísimo, cuando
 * lo cierto es que no se recoge casi nada. Ahora son cuatro frases.
 *
 * Lo que no se ha quitado, porque no es decoración sino lo que el RGPD exige
 * que aparezca: quién responde, qué se guarda, para qué, qué derechos tienes y
 * ante quién reclamar. Eso se queda aunque estorbe.
 */
export default function PrivacidadPage() {
  return (
    <PaperShell>
      <PaperTitle eyebrow="Privacidad">
        No guardamos
        <br />
        casi nada
      </PaperTitle>

      <div className="space-y-6 text-[15px] leading-7 text-white/65 md:text-base md:leading-8">
        <p>
          <Lead>Jugar no deja rastro.</Lead> No hace falta cuenta para entrar, y tus
          partidas, tus notas y el tema que elijas se quedan en este dispositivo.
          No llegan a ningún servidor y desaparecen si borras los datos del
          navegador.
        </p>

        <p>
          <Lead>Si nos escribes, guardamos tu correo y tu mensaje.</Lead> Solo para
          poder contestarte, y solo lo ve el profesorado de la escuela. Ni
          teléfono, ni dirección, ni pagos, ni micrófono.
        </p>

        <p>
          <Lead>Sin cookies.</Lead> Ni de sesión, ni de rastreo, ni de analítica. Sin
          publicidad y sin ceder nada a terceros.
        </p>

        <p>
          <Lead>Es tuyo y te lo puedes llevar.</Lead> Pídenos ver, corregir o borrar lo
          que tengamos, cuando quieras, desde{" "}
          <Link
            href="/contact"
            className="text-amber-300 underline decoration-amber-300/30 underline-offset-4 transition hover:decoration-amber-300"
          >
            contacto
          </Link>
          . Si algo no te cuadra, puedes reclamar ante la AEPD.
        </p>
      </div>

      <div className="mt-14">
        <div aria-hidden className="mb-6 h-px w-16 bg-white/15" />
        <p className="text-[13px] leading-6 text-white/30">
          Responsable: {SITE.academyName} ({SITE.name}). Los mensajes del formulario
          se guardan en servidores de Supabase el tiempo necesario para atenderlos.
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
    <strong
      className="font-normal italic text-white"
      style={{ fontFamily: DISPLAY_FONT }}
    >
      {children}
    </strong>
  );
}
