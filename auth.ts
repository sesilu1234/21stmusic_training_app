import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = new Set(
  (process.env.ALLOWED_STUDENT_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
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
