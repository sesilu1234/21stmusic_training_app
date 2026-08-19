import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getStudent } from "./students";

/**
 * auth() revienta si el navegador trae una cookie de sesión vieja que ya no se
 * puede descifrar (JWTSessionError). Eso no es un fallo de la app: es una
 * sesión caducada, así que se trata como "no hay sesión" y a login.
 */
export const safeAuth = async () => {
  try {
    return await auth();
  } catch {
    return null;
  }
};

/** Página de servidor: exige alumno activo, si no manda a /login. */
export const requireStudent = async () => {
  const session = await safeAuth();
  const student = await getStudent(session?.user?.email);

  // Si hay sesión pero no es alumno, se dice por qué: si no, /login vería la
  // sesión, devolvería aquí, y el navegador entraría en bucle de redirecciones.
  if (!student) redirect(session ? "/login?error=AccessDenied" : "/login");

  return { student, image: session?.user?.image ?? null };
};
