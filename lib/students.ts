import { getSupabaseAdmin } from "./supabaseAdmin";

export const normalizeEmail = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

export const normalizeUsername = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

/**
 * Los tres roles. `alumno` es el de todo el mundo salvo que se diga otra cosa.
 *
 * Es una unión de literales y no un `string` suelto a propósito: así, si algún
 * día se añade un rol, TypeScript señala todos los sitios donde hay que
 * decidir qué hace ese rol nuevo en vez de dejarlos pasar callando.
 */
export type StudentRole = "admin" | "profesor" | "alumno";

const ROLES: StudentRole[] = ["admin", "profesor", "alumno"];

/**
 * El rol de una fila, con `alumno` como red.
 *
 * La columna tiene un CHECK que no deja meter otra cosa, pero esto lee lo que
 * venga de fuera del código: una columna añadida a mano, una base de datos sin
 * migrar, una fila de antes. Ante la duda, el rol que menos puede ver.
 */
const toRole = (value: unknown): StudentRole =>
  ROLES.includes(value as StudentRole) ? (value as StudentRole) : "alumno";

export interface Student {
  email: string;
  displayName: string;
  username: string | null;
  isActive: boolean;
  createdAt: string;
  role: StudentRole;
}

interface StudentRow {
  email: string;
  display_name: string;
  username: string | null;
  is_active: boolean;
  created_at: string;
  role: string | null;
}

const toStudent = (row: StudentRow): Student => ({
  email: row.email,
  displayName: row.display_name,
  username: row.username,
  isActive: row.is_active,
  createdAt: row.created_at,
  role: toRole(row.role),
});

const BASE_COLUMNS = "email, display_name, username, is_active, created_at";

/**
 * Si la columna `role` está o no. Empieza suponiendo que sí.
 *
 * `db/roles.sql` la añade, pero las migraciones se pasan a mano y no tienen por
 * qué caer a la vez que el despliegue. Sin esto, en la ventana entre subir el
 * código y ejecutar el SQL, PostgREST rechazaría TODAS las consultas de alumnos
 * por pedir una columna que no existe — y como `currentStudent` trata un fallo
 * de consulta como "no hay sesión", la escuela entera aparecería sin haber
 * entrado. Un panel que no se ve es un problema; que nadie pueda usar la app es
 * otro.
 *
 * Se apaga sola en el primer 42703 (`undefined_column`) y ya no se vuelve a
 * pedir mientras dure el proceso. Al ejecutar la migración y reiniciar, vuelve
 * a arrancar en true y se queda.
 */
let hasRoleColumn = true;

const UNDEFINED_COLUMN = "42703";

const columns = () => (hasRoleColumn ? `${BASE_COLUMNS}, role` : BASE_COLUMNS);

/**
 * Lanza la consulta y, si se queja de que `role` no existe, la repite sin ella.
 *
 * Recibe una función y no una consulta ya hecha porque las de Supabase no se
 * pueden volver a ejecutar: hay que construir otra desde cero para reintentar.
 */
const withRoleFallback = async <T>(
  run: (
    cols: string,
  ) => PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>,
) => {
  const first = await run(columns());
  if (!first.error || first.error.code !== UNDEFINED_COLUMN || !hasRoleColumn) return first;

  console.warn(
    "[alumnos] la columna `role` no existe todavía: ejecuta db/roles.sql. " +
      "Mientras tanto todo el mundo cuenta como alumno.",
  );
  hasRoleColumn = false;
  return run(columns());
};

/**
 * Alumnos cuyo nombre o usuario contenga lo buscado. Para la página del
 * profesorado, que busca escribiendo el nombre a medias.
 *
 * `ilike` con comodines a los dos lados: "mar" encuentra "María" y "Omar". Va
 * sin índice porque son unas pocas decenas de alumnos; con miles habría que
 * mirar `pg_trgm`.
 *
 * Incluye a los desactivados, al revés que `getStudent`: el profesor querrá
 * poder mirar el progreso de alguien que ya no está en la escuela.
 */
export const searchStudents = async (query: unknown): Promise<Student[]> => {
  const clean = String(query ?? "").trim();
  if (clean.length < 2) return [];

  // Los comodines de LIKE que pueda traer el texto se escapan, o buscar "%"
  // devolvería la lista entera.
  const safe = clean.replace(/[\%_]/g, (match) => `\${match}`);

  const { data, error } = await withRoleFallback<StudentRow[]>((cols) =>
    getSupabaseAdmin()
      .from("students")
      .select(cols)
      .or(`display_name.ilike.%${safe}%,username.ilike.%${safe}%,email.ilike.%${safe}%`)
      .order("display_name")
      .limit(25)
      .returns<StudentRow[]>(),
  );

  if (error) throw new Error(`No se ha podido buscar alumnos: ${error.message}`);
  return (data ?? []).map(toStudent);
};

/**
 * Alumno por email, esté activo o no.
 *
 * `getStudent` filtra por activo porque lo usa la sesión: una cuenta apagada no
 * puede entrar. Aquí no, porque la consulta del profesorado tiene que poder
 * mirar el progreso de alguien que ya dejó la escuela.
 */
export const getStudentAnyStatus = async (email: unknown): Promise<Student | null> => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return null;

  const { data } = await withRoleFallback<StudentRow>((cols) =>
    getSupabaseAdmin()
      .from("students")
      .select(cols)
      .eq("email", cleanEmail)
      .maybeSingle<StudentRow>(),
  );

  return data ? toStudent(data) : null;
};

/** Alumno activo por email. Devuelve null si no existe o está desactivado. */
export const getStudent = async (email: unknown): Promise<Student | null> => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return null;

  const { data, error } = await withRoleFallback<StudentRow>((cols) =>
    getSupabaseAdmin()
      .from("students")
      .select(cols)
      .eq("email", cleanEmail)
      .eq("is_active", true)
      .maybeSingle<StudentRow>(),
  );

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

  // Con más razón que las demás: si esta se cayera por la columna que falta,
  // nadie podría entrar en la app.
  const { data } = await withRoleFallback<StudentRow & { password: string | null }>((cols) =>
    getSupabaseAdmin()
      .from("students")
      .select(`${cols}, password`)
      .eq("username", cleanUsername)
      .eq("is_active", true)
      .maybeSingle<StudentRow & { password: string | null }>(),
  );

  if (!data) return null;
  return { ...toStudent(data), password: data.password };
};
