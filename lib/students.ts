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
  /**
   * Cuándo entró por última vez, o null si no ha entrado nunca.
   *
   * Es el único dato de la app que no se puede deducir de `game_attempts`:
   * entrar sin jugar no deja partida. Sin esto, el alumno que no sabe usar su
   * contraseña y el que entra y no practica se ven exactamente igual.
   */
  lastLoginAt: string | null;
  firstLoginAt: string | null;
  loginCount: number;
  /**
   * Si sale en el cuadro de honor y en los rankings del reto. Por defecto sí
   * (db/honor_todos.sql); false si él lo quita, y también si la columna
   * todavía no existe (db/honor.sql).
   */
  showInHonor: boolean;
  /**
   * Cuándo cerró el aviso de "sales en el cuadro de honor". Null = todavía no
   * lo ha visto, y entonces se le enseña en la portada.
   */
  honorNoticeSeenAt: string | null;
}

interface StudentRow {
  email: string;
  display_name: string;
  username: string | null;
  is_active: boolean;
  created_at: string;
  role: string | null;
  last_login_at?: string | null;
  first_login_at?: string | null;
  login_count?: number | null;
  show_in_honor?: boolean | null;
  honor_notice_seen_at?: string | null;
}

const toStudent = (row: StudentRow): Student => ({
  email: row.email,
  displayName: row.display_name,
  username: row.username,
  isActive: row.is_active,
  createdAt: row.created_at,
  role: toRole(row.role),
  // `?? null` y no `!`: estas tres columnas pueden no estar todavía (ver
  // OPTIONAL_GROUPS), y entonces la fila llega sin ellas.
  lastLoginAt: row.last_login_at ?? null,
  firstLoginAt: row.first_login_at ?? null,
  loginCount: row.login_count ?? 0,
  showInHonor: row.show_in_honor === true,
  honorNoticeSeenAt: row.honor_notice_seen_at ?? null,
});

const BASE_COLUMNS = "email, display_name, username, is_active, created_at";

/**
 * Columnas que puede ser que la base de datos todavía no tenga.
 *
 * Las migraciones de este proyecto se pasan a mano en el editor SQL de
 * Supabase, así que no caen necesariamente a la vez que el despliegue. Sin esta
 * red, en la ventana entre subir el código y ejecutar el SQL, PostgREST
 * rechazaría TODAS las consultas de alumnos por pedir una columna que no
 * existe — y como `currentStudent` trata un fallo de consulta como "no hay
 * sesión", la escuela entera aparecería sin haber entrado. Un panel que no se
 * ve es un problema; que nadie pueda usar la app es otro.
 *
 * Van por grupos y no en una lista sola para que la falta de una no apague las
 * otras: quien ya pasó `roles.sql` pero no `last_login.sql` sigue viendo los
 * roles.
 */
const OPTIONAL_GROUPS = {
  role: { columns: ["role"], sql: "db/roles.sql" },
  login: {
    columns: ["last_login_at", "first_login_at", "login_count"],
    sql: "db/last_login.sql",
  },
  honor: { columns: ["show_in_honor"], sql: "db/honor.sql" },
  honorNotice: { columns: ["honor_notice_seen_at"], sql: "db/honor_todos.sql" },
} as const;

type OptionalGroup = keyof typeof OPTIONAL_GROUPS;

/**
 * Qué grupos se piden. Empieza suponiendo que están todos.
 *
 * Un grupo se apaga solo en el primer 42703 (`undefined_column`) que mencione
 * alguna de sus columnas, y ya no se vuelve a pedir mientras dure el proceso.
 * Al ejecutar la migración y reiniciar, vuelve a arrancar en true y se queda.
 */
const enabled: Record<OptionalGroup, boolean> = {
  role: true,
  login: true,
  honor: true,
  honorNotice: true,
};

const UNDEFINED_COLUMN = "42703";

const columns = () =>
  [
    BASE_COLUMNS,
    ...(Object.keys(OPTIONAL_GROUPS) as OptionalGroup[])
      .filter((group) => enabled[group])
      .flatMap((group) => OPTIONAL_GROUPS[group].columns),
  ].join(", ");

/**
 * El grupo al que culpa un error de columna inexistente.
 *
 * PostgREST dice cuál falta en el texto ("column students.login_count does not
 * exist"), así que se busca ahí. Si no se reconoce ninguna —otra versión de
 * PostgREST, otro texto—, se apaga el primer grupo que siga encendido: es
 * preferible perder un dato de adorno a dejar la app sin poder leer alumnos.
 *
 * El grupo nombrado se busca entre TODOS, también los ya apagados. Si solo se
 * buscara entre los encendidos, dos consultas que fallan a la vez por la misma
 * columna se pisaban: la primera apagaba su grupo, y la segunda, al no
 * encontrarlo ya encendido, culpaba al primero de la lista —los roles— y la
 * app dejaba de saber quién es profesor o admin hasta reiniciar el servidor.
 */
const groupToBlame = (message: string): OptionalGroup | null => {
  const all = Object.keys(OPTIONAL_GROUPS) as OptionalGroup[];
  return (
    all.find((group) =>
      OPTIONAL_GROUPS[group].columns.some((column) => message.includes(column)),
    ) ??
    all.find((group) => enabled[group]) ??
    null
  );
};

/**
 * Lanza la consulta y, si se queja de una columna que no existe, apaga el grupo
 * al que pertenece y la repite sin ella.
 *
 * Recibe una función y no una consulta ya hecha porque las de Supabase no se
 * pueden volver a ejecutar: hay que construir otra desde cero para reintentar.
 *
 * Se reintenta como mucho una vez por grupo opcional, así que en el peor caso
 * acaba consultando solo las columnas de siempre.
 */
const withOptionalColumns = async <T>(
  run: (
    cols: string,
  ) => PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>,
) => {
  let result = await run(columns());

  for (let attempt = 0; attempt < Object.keys(OPTIONAL_GROUPS).length; attempt++) {
    if (!result.error || result.error.code !== UNDEFINED_COLUMN) return result;

    const group = groupToBlame(result.error.message);
    if (!group) return result;

    // Ya lo apagó otra consulta que falló a la vez: basta con repetir esta.
    if (!enabled[group]) {
      result = await run(columns());
      continue;
    }

    console.warn(
      `[alumnos] faltan columnas en la base de datos: ejecuta ${OPTIONAL_GROUPS[group].sql}. ` +
        "Mientras tanto se consulta sin ellas.",
    );
    enabled[group] = false;
    result = await run(columns());
  }

  return result;
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

  const { data, error } = await withOptionalColumns<StudentRow[]>((cols) =>
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

  const { data } = await withOptionalColumns<StudentRow>((cols) =>
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

  const { data, error } = await withOptionalColumns<StudentRow>((cols) =>
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
  const { data } = await withOptionalColumns<StudentRow & { password: string | null }>((cols) =>
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

/**
 * Apunta que este alumno acaba de entrar.
 *
 * No devuelve promesa a propósito: quien la llama NO debe esperarla. Es una
 * estadística, y una estadística no puede retrasar el login ni impedirlo si
 * Supabase está lento o la migración no se ha pasado. Se lanza y se olvida.
 *
 * Va por función de Postgres (`record_login`, en db/last_login.sql) porque los
 * tres campos no son valores sino expresiones: la primera entrada solo se
 * escribe si estaba vacía y el contador se incrementa sobre sí mismo. Hacerlo
 * con un select + update desde aquí serían dos viajes, y dos entradas a la vez
 * podrían pisarse el contador.
 */
export const touchLogin = (email: unknown): void => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return;

  void getSupabaseAdmin()
    .rpc("record_login", { p_email: cleanEmail })
    .then(({ error }: { error: { message: string } | null }) => {
      // Se avisa pero no se levanta: lo normal es que falte pasar la migración.
      if (error) console.warn("[alumnos] no se ha apuntado la entrada:", error.message);
    });
};

/**
 * Los alumnos que salen en el cuadro de honor y en los rankings del reto.
 *
 * Solo activos, y de cualquier rol: sale todo el mundo menos quien se ha
 * quitado. El profesorado que no quiera mezclar sus partidas de prueba con las
 * de los alumnos no tiene más que quitarse desde su menú.
 *
 * Si la columna no existe todavía, no hay nadie: mejor un cuadro vacío que
 * enseñar a alguien que no ha podido decidir.
 */
export const listHonorStudents = async (): Promise<Student[]> => {
  if (!enabled.honor) return [];

  // Sin `withOptionalColumns`: aquí la columna también va en el filtro, y si
  // faltara, el reintento seguiría fallando por el filtro y acabaría apagando
  // grupos que no tienen la culpa (los roles, las entradas).
  const run = () =>
    getSupabaseAdmin()
      .from("students")
      .select(columns())
      .eq("is_active", true)
      .eq("show_in_honor", true)
      .returns<StudentRow[]>();

  let { data, error } = await run();

  // La del aviso solo va en el select, no en el filtro: si falta, se apaga su
  // grupo y se repite sin ella. El cuadro no depende de que se haya pasado
  // db/honor_todos.sql.
  if (error?.code === UNDEFINED_COLUMN && error.message.includes("honor_notice_seen_at")) {
    console.warn("[alumnos] falta la columna honor_notice_seen_at: ejecuta db/honor_todos.sql.");
    enabled.honorNotice = false;
    ({ data, error } = await run());
  }

  if (error?.code === UNDEFINED_COLUMN && error.message.includes("show_in_honor")) {
    console.warn("[alumnos] falta la columna show_in_honor: ejecuta db/honor.sql.");
    enabled.honor = false;
    return [];
  }
  if (error) throw new Error(`No se ha podido leer el cuadro de honor: ${error.message}`);

  return (data ?? []).map(toStudent);
};

/**
 * Cambia si un alumno sale o no en el cuadro de honor. El email lo pone el
 * servidor desde la sesión, nunca el navegador.
 *
 * Tocar el interruptor es haberse enterado, así que de paso se da el aviso de
 * la portada por visto (ver `markHonorNoticeSeen`).
 */
export const setShowInHonor = async (email: unknown, value: boolean) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) throw new Error("Sin alumno");

  const { error } = await getSupabaseAdmin()
    .from("students")
    .update({ show_in_honor: value })
    .eq("email", cleanEmail);

  if (error) {
    // En un update, PostgREST no llega a Postgres: contesta PGRST204 (columna
    // que no está en su caché del esquema) en vez del 42703.
    if (error.code === UNDEFINED_COLUMN || error.code === "PGRST204") {
      throw new Error("Falta ejecutar db/honor.sql en la base de datos.");
    }
    throw new Error(`No se ha podido guardar: ${error.message}`);
  }
};

/**
 * Da por visto el aviso de "sales en el cuadro de honor".
 *
 * Si la columna no existe todavía no pasa nada: el aviso sale porque nadie lo
 * ha cerrado, y en cuanto se pase db/honor_todos.sql deja de salir.
 */
export const markHonorNoticeSeen = async (email: unknown) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !enabled.honorNotice) return;

  const { error } = await getSupabaseAdmin()
    .from("students")
    .update({ honor_notice_seen_at: new Date().toISOString() })
    .eq("email", cleanEmail)
    .is("honor_notice_seen_at", null);

  if (error && (error.code === UNDEFINED_COLUMN || error.code === "PGRST204")) {
    console.warn("[alumnos] falta la columna honor_notice_seen_at: ejecuta db/honor_todos.sql.");
    enabled.honorNotice = false;
    return;
  }
  if (error) throw new Error(`No se ha podido guardar: ${error.message}`);
};

/**
 * El nombre de cada correo, para pintar listas (resultados de un examen, el
 * creador de un examen). Los que no estén se quedan fuera del mapa: quien
 * pinta decide qué poner.
 */
export const displayNamesOf = async (emails: string[]): Promise<Map<string, string>> => {
  const unique = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
  if (!unique.length) return new Map();

  const { data, error } = await getSupabaseAdmin()
    .from("students")
    .select("email, display_name")
    .in("email", unique)
    .returns<{ email: string; display_name: string }[]>();

  if (error) throw new Error(`No se han podido leer los nombres: ${error.message}`);
  return new Map((data ?? []).map((row) => [row.email, row.display_name]));
};
