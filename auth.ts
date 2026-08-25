import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getStudentForLogin } from "@/lib/students";
import { verifyPassword } from "@/lib/passwords";

/**
 * Solo usuario y contraseña: las cuentas las da de alta el profesor a mano en
 * la tabla `students`. La entrada con Google se quitó a propósito.
 *
 * Entrar NO es obligatorio para usar la app: la sesión solo abre los modos
 * marcados como `studentsOnly` en el catálogo de juegos.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const username = String(credentials?.username || "");
        const password = String(credentials?.password || "");
        if (!username || !password) return null;

        const student = await getStudentForLogin(username);
        if (!student || !verifyPassword(password, student.password)) return null;

        return {
          id: student.email,
          email: student.email,
          name: student.displayName,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },

  // Auth.js solo se fía de la cabecera Host cuando reconoce la plataforma
  // (Vercel). Sin esto, un `next start` en local o en cualquier otro servidor
  // responde UntrustedHost a todo /api/auth.
  trustHost: true,

  logger: {
    error(error) {
      // JWTSessionError = el navegador trae una cookie de sesión que ya no se
      // puede descifrar (sesión vieja u otro AUTH_SECRET). Auth.js lo captura
      // por dentro y devuelve "sin sesión", así que solo es ruido: el usuario
      // simplemente vuelve a entrar. Cualquier otro error sí se muestra.
      if ((error as { type?: string })?.type === "JWTSessionError") return;
      console.error(error);
    },
  },
});
