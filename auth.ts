import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import {
  displayNameFromEmail,
  getAllowedStudentEmails,
  normalizeEmail,
} from "@/lib/studentAuthShared";

const allowedEmails = new Set(getAllowedStudentEmails());

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        const password = String(credentials?.password || "");
        const { verifyStudentPassword } = await import("@/lib/studentAuth");
        if (!(await verifyStudentPassword(email, password))) return null;
        return {
          id: email,
          email,
          name: displayNameFromEmail(email),
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      if (allowedEmails.size === 0) return false;
      return allowedEmails.has(email);
    },
    async authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path === "/login") return true;
      return !!auth;
    },
  },
});
