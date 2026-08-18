import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { getStudent, getStudentForLogin } from "@/lib/students";
import { verifyPassword } from "@/lib/passwords";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // 1. Google: solo entran los correos dados de alta en `students`.
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),

    // 2. Usuario y contraseña guardados en la misma tabla `students`.
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

  callbacks: {
    async signIn({ user, account }) {
      // Credentials ya se ha validado contra la base de datos en `authorize`.
      if (account?.provider === "credentials") return true;
      return Boolean(await getStudent(user.email));
    },
  },
});
