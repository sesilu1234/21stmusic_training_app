import Link from "next/link";
import InfoShell, { InfoSection } from "../components/InfoShell";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacidad · 21st Century Music" };

export default function PrivacidadPage() {
  return (
    <InfoShell
      eyebrow="Privacidad"
      title="Política de privacidad"
      intro={`Qué datos guarda esta app, para qué y quién los ve. Última actualización: ${SITE.privacyUpdatedAt}.`}
    >
      <InfoSection title="Quién trata tus datos">
        <p>
          {SITE.academyName} ({SITE.name}), a través de esta aplicación de entrenamiento. Para
          cualquier cosa relacionada con tus datos, escríbenos por el{" "}
          <Link href="/contacto" className="text-amber-300 underline underline-offset-2">
            formulario de contacto
          </Link>
          .
        </p>
      </InfoSection>

      <InfoSection title="Qué guardamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/90">Cuenta:</strong> tu correo electrónico, tu nombre para
            mostrar y, si entras con usuario y contraseña de la academia, ese usuario y contraseña.
            Las cuentas las da de alta la academia; aquí no hay registro abierto.
          </li>
          <li>
            <strong className="text-white/90">Si entras con Google:</strong> Google nos comunica tu
            correo, tu nombre y tu foto de perfil. No pedimos ni recibimos nada más de tu cuenta de
            Google, y solo dejamos entrar a correos ya dados de alta como alumno.
          </li>
          <li>
            <strong className="text-white/90">Partidas:</strong> por cada partida terminada se
            guarda el modo de juego, cuántos ejercicios acertaste, cuántos había y la fecha. De ahí
            salen el progreso, las medallas y el ranking.
          </li>
          <li>
            <strong className="text-white/90">Medallas:</strong> qué modo has completado con pleno y
            cuándo.
          </li>
          <li>
            <strong className="text-white/90">Mensajes de contacto:</strong> si nos escribes por el
            formulario, guardamos el nombre, el correo y el texto que nos dejas, para poder
            contestarte. Si tenías la sesión abierta, se guarda también desde qué cuenta se envió.
          </li>
        </ul>
        <p>
          No guardamos tu dirección, tu teléfono, tu forma de pago ni el audio o el micrófono. Los
          sonidos de los ejercicios se generan en tu propio navegador.
        </p>
      </InfoSection>

      <InfoSection title="Qué NO sale de tu navegador">
        <p>
          Las notas que escribes en el apartado <strong className="text-white/90">Notas</strong> se
          guardan solo en el almacenamiento local de tu dispositivo. No viajan a ningún servidor, no
          las vemos, y desaparecen si borras los datos del navegador o cambias de ordenador. También
          se guarda ahí tu preferencia de tema claro/oscuro.
        </p>
      </InfoSection>

      <InfoSection title="Para qué usamos los datos">
        <ul className="list-disc space-y-2 pl-5">
          <li>Dejarte entrar y mantener tu sesión abierta.</li>
          <li>Enseñarte tu progreso, tus medallas y tu histórico de partidas.</li>
          <li>
            Que el profesorado pueda ver cómo va cada alumno y ajustar lo que se trabaja en clase.
          </li>
        </ul>
        <p>
          No usamos tus datos para publicidad, no los vendemos y no los cedemos a terceros con fines
          comerciales.
        </p>
      </InfoSection>

      <InfoSection title="Quién puede verlos">
        <ul className="list-disc space-y-2 pl-5">
          <li>El profesorado y la dirección de la academia.</li>
          <li>
            <strong className="text-white/90">Otros alumnos, en parte:</strong> el ranking y el
            cuadro de honor muestran tu nombre para mostrar, tus puntos y tus medallas al resto de
            usuarios de la app. Tu correo, tus partidas concretas y tus notas no se muestran nunca.
            Si prefieres que tu nombre no aparezca ahí, escríbenos.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Cookies">
        <p>
          Solo usamos una cookie técnica de sesión, la que sirve para saber que has iniciado sesión y
          no tener que pedirte la contraseña en cada página. No hay cookies de publicidad ni de
          seguimiento, ni analítica de terceros.
        </p>
      </InfoSection>

      <InfoSection title="Dónde se guardan y cuánto tiempo">
        <p>
          Los datos se alojan en servidores de Supabase, que actúa como proveedor de base de datos.
          El inicio de sesión con Google lo gestiona Google. Conservamos los datos mientras tu cuenta
          esté activa como alumno; cuando lo pidas o cuando la academia dé de baja la cuenta, se
          eliminan.
        </p>
      </InfoSection>

      <InfoSection title="Tus derechos">
        <p>
          Puedes pedir acceso a tus datos, corregirlos, borrarlos, limitar su uso u oponerte a él, y
          pedir una copia. Basta con decírnoslo por el{" "}
          <Link href="/contacto" className="text-amber-300 underline underline-offset-2">
            formulario de contacto
          </Link>
          , indicando el correo de tu cuenta. Si crees que no hemos hecho las cosas bien, puedes
          reclamar ante la Agencia Española de Protección de Datos (aepd.es).
        </p>
      </InfoSection>

      <InfoSection title="Menores">
        <p>
          Las cuentas de alumnos menores de edad las crea la academia con el consentimiento de sus
          padres o tutores, dentro de la relación de la escuela con la familia.
        </p>
      </InfoSection>
    </InfoShell>
  );
}
