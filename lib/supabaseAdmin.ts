import { createClient } from "@supabase/supabase-js";

// Supabase solo se usa desde el servidor, así que la URL no necesita el
// prefijo NEXT_PUBLIC_ (que la incrustaría en el JS que descarga el navegador).
// Se acepta el nombre viejo mientras quede algún entorno sin renombrar.
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server configuration");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
