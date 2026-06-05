import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { displayNameFromEmail, normalizeEmail } from "@/lib/studentAuthShared";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
  clientId: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
  authorization: {
    params: {
      prompt: "select_account",
    },
  },
}),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = normalizeEmail(user.email);
      if (!email) return false;

      const supabase = getSupabaseAdmin();
      const { data: allowedStudent, error } = await supabase
        .from("allowed_students")
        .select("email, display_name, is_active")
        .eq("email", email)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !allowedStudent) return false;

      const displayName =
        allowedStudent.display_name ||
        user.name ||
        displayNameFromEmail(email);

      await supabase.from("student_profiles").upsert(
        {
          email,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );

      return true;
    },
    async authorized() {
      return true;
    },
  },
});
