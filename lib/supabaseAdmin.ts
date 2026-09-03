// Este import no hace nada en tiempo de ejecucion: es un cerrojo. Si algun dia
// un componente de cliente acaba tirando de este archivo, aunque sea sin querer
// y a traves de tres modulos, la compilacion FALLA en vez de colarse.
//
// No es un lujo. Estaba pasando: `lib/notes.ts` y `lib/contact.ts` mezclaban
// constantes que necesita el navegador con el acceso a la base de datos, y sus
// formularios se llevaban al bundle del cliente todo esto y la libreria de
// Supabase entera. La clave no llegaba a filtrarse —en el navegador
// `process.env.SUPABASE_SERVICE_ROLE_KEY` no existe y esto simplemente
// reventaria—, pero era un accidente esperando a ocurrir.
import "server-only";

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
