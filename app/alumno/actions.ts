"use server";

import { isStaffKey } from "@/lib/internalKey";
import { searchStudents } from "@/lib/students";

export interface Match {
  email: string;
  displayName: string;
  hint: string;
  isActive: boolean;
}

/**
 * La búsqueda que se va llamando mientras se escribe.
 *
 * La clave se vuelve a comprobar AQUÍ, y no vale con que la página ya la haya
 * mirado: una acción de servidor es un punto de entrada más de la aplicación, y
 * se puede llamar directamente sin pasar por la página. Si la comprobación
 * viviera solo en `page.tsx`, esto sería una lista de alumnos abierta a quien
 * supiera el nombre de la acción.
 *
 * Devuelve lo justo para pintar el desplegable. El progreso no viaja por aquí:
 * eso lo carga la página cuando ya se ha elegido a alguien.
 */
export const findStudents = async (key: string, query: string): Promise<Match[]> => {
  if (!isStaffKey(key)) return [];

  try {
    const students = await searchStudents(query);
    return students.map((student) => ({
      email: student.email,
      displayName: student.displayName,
      hint: student.username ?? student.email,
      isActive: student.isActive,
    }));
  } catch {
    // Un fallo de la base de datos deja el desplegable vacío. A quien busca se
    // le enseña "sin resultados", que es lo único que puede hacer.
    return [];
  }
};
