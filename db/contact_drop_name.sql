-- =====================================================================
-- Quitar la columna `name` de contact_messages
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- El formulario de contacto tuvo un campo "nombre" que se quitó hace tiempo.
-- La columna se quedó en la tabla, y con NOT NULL: cada envío intentaba meter
-- una fila sin `name` y Postgres lo rechazaba (23502). O sea que el formulario
-- llevaba roto desde que se quitó el campo.
--
-- `db/contact_messages.sql` ya traía un bloque que le quitaba el NOT NULL, pero
-- ese archivo nunca se llegó a ejecutar sobre esta base de datos. Aquí se borra
-- la columna entera en vez de dejarla opcional: no la escribe nadie y una
-- columna que no se usa solo sirve para volver a romper algo más adelante.
--
-- Comprobado antes de escribir esto: la tabla estaba vacía, así que no se
-- pierde ningún nombre de ningún mensaje.
-- =====================================================================

begin;

alter table contact_messages drop column if exists name;

commit;
