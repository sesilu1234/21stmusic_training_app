import { getSupabaseAdmin } from "./supabaseAdmin";

export const normalizeEmail = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

export const normalizeUsername = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

export interface Student {
  email: string;
  displayName: string;
  username: string | null;
  isActive: boolean;
  createdAt: string;
}

interface StudentRow {
  email: string;
  display_name: string;
  username: string | null;
  is_active: boolean;
  created_at: string;
}

const toStudent = (row: StudentRow): Student => ({
  email: row.email,
  displayName: row.display_name,
  username: row.username,
  isActive: row.is_active,
  createdAt: row.created_at,
});

const STUDENT_COLUMNS = "email, display_name, username, is_active, created_at";

/** Alumno activo por email. Devuelve null si no existe o está desactivado. */
export const getStudent = async (email: unknown): Promise<Student | null> => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("students")
    .select(STUDENT_COLUMNS)
    .eq("email", cleanEmail)
    .eq("is_active", true)
    .maybeSingle<StudentRow>();

  // Un fallo de base de datos NO es "no eres alumno". Si se confunden, la
  // página manda a /login, /login ve que hay sesión y manda a /, y el
  // navegador se queda dando vueltas (ERR_TOO_MANY_REDIRECTS).
  if (error) throw new Error(`No se ha podido consultar el alumno: ${error.message}`);

  return data ? toStudent(data) : null;
};

/** Alumno activo por usuario, con su contraseña para poder validarla. */
export const getStudentForLogin = async (username: unknown) => {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername) return null;

  const { data } = await getSupabaseAdmin()
    .from("students")
    .select(`${STUDENT_COLUMNS}, password`)
    .eq("username", cleanUsername)
    .eq("is_active", true)
    .maybeSingle<StudentRow & { password: string | null }>();

  if (!data) return null;
  return { ...toStudent(data), password: data.password };
};
