"use server";

import { signOut } from "@/auth";

export async function logout() {
  // A la portada, no a /login: entrar es opcional, así que salir de la sesión
  // deja la app perfectamente usable.
  await signOut({ redirectTo: "/" });
}
