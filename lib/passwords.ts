import { timingSafeEqual } from "node:crypto";

/**
 * La contraseña se guarda tal cual en `students.password` para que el profesor
 * pueda dar de alta alumnos desde el editor de Supabase viéndola escrita.
 * La comparación es en tiempo constante para no filtrar información.
 */
export const verifyPassword = (password: string, stored: string | null | undefined) => {
  const expected = String(stored ?? "");
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};
