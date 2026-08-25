import { auth } from "@/auth";
import { getStudent, type Student } from "./students";

/**
 * auth() revienta si el navegador trae una cookie de sesión vieja que ya no se
 * puede descifrar (JWTSessionError). Eso no es un fallo de la app: es una
 * sesión caducada, así que se trata como "no hay sesión".
 */
export const safeAuth = async () => {
  try {
    return await auth();
  } catch {
    return null;
  }
};

/**
 * El alumno de la sesión, o null si no ha entrado.
 *
 * Nunca redirige y nunca lanza: entrar es opcional, así que una base de datos
 * caída tiene que dejar la app usable en modo "sin cuenta" en vez de tirar
 * abajo la portada.
 */
export const currentStudent = async (): Promise<Student | null> => {
  const session = await safeAuth();
  if (!session?.user?.email) return null;

  try {
    return await getStudent(session.user.email);
  } catch {
    return null;
  }
};
