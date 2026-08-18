"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function loginWithPassword(_previous: string | null, formData: FormData) {
  try {
    await signIn("credentials", {
      username: String(formData.get("username") || ""),
      password: String(formData.get("password") || ""),
      redirectTo: "/",
    });
  } catch (error) {
    // signIn redirige lanzando NEXT_REDIRECT: eso no se toca.
    if (error instanceof AuthError) return "Usuario o contraseña incorrectos.";
    throw error;
  }

  return null;
}
