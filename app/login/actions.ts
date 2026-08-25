"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginWithPassword(_previous: string | null, formData: FormData) {
  const next = String(formData.get("next") || "/");

  try {
    await signIn("credentials", {
      username: String(formData.get("username") || ""),
      password: String(formData.get("password") || ""),
      // Solo se admiten rutas internas: si no, un ?next=https://otro.sitio
      // convertiría el login en un redirector abierto.
      redirectTo: next.startsWith("/") && !next.startsWith("//") ? next : "/",
    });
  } catch (error) {
    // signIn redirige lanzando NEXT_REDIRECT: eso no se toca.
    if (error instanceof AuthError) return "Usuario o contraseña incorrectos.";
    throw error;
  }

  return null;
}
