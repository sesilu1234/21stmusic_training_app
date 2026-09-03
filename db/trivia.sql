-- =====================================================================
-- Preguntas del trivial
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- =====================================================================
-- Las preguntas vivían en un archivo del código (app/play/trivia/
-- preguntasTrivial.tsx) que se importaba desde un componente de cliente. Con
-- 78 daba igual; con quinientas ya no, porque ese archivo se descarga ENTERO
-- al navegador de cualquiera que abra el trivial, para usar 24 preguntas. En la
-- base de datos, el servidor pide 24 y manda 24.
--
-- Y lo que de verdad cambia: quien escribe las preguntas ya no necesita tocar
-- el código ni desplegar nada. Se escriben en una hoja de cálculo, se exporta a
-- CSV y se importa desde el panel de Supabase (ver db/trivia_plantilla.csv).
--
-- Las opciones van en cuatro columnas sueltas y no en un array porque esto
-- tiene que poder llenarse importando un CSV, y un array de texto en un CSV es
-- un incordio. La app las junta y las baraja al servirlas.
-- =====================================================================

begin;

create table if not exists trivia_questions (
  id        uuid primary key default gen_random_uuid(),
  -- El slug del tema, que además es el nivel del modo: /play/trivia/guitarra.
  -- Los temas válidos están en lib/trivia.ts; aquí no se comprueban con un
  -- CHECK a propósito, para poder añadir uno nuevo importando un CSV sin tener
  -- que pasar antes una migración.
  tema      text     not null check (length(btrim(tema)) > 0),
  pregunta  text     not null check (length(btrim(pregunta)) > 0),
  opcion_1  text     not null,
  opcion_2  text     not null,
  opcion_3  text     not null,
  opcion_4  text     not null,
  -- Cuál de las cuatro es la buena. Un número y no el texto repetido: si se
  -- guardara el texto, una errata al copiarlo dejaría la pregunta sin respuesta
  -- correcta y nadie se enteraría hasta que un alumno se quedase atascado.
  correcta  smallint not null check (correcta between 1 and 4),
  -- Para retirar una pregunta mal formulada sin borrarla.
  activa    boolean  not null default true,
  created_at timestamptz not null default now()
);

-- Con quinientas preguntas escritas a ratos, repetir alguna sin darse cuenta no
-- es una posibilidad, es una certeza. El índice lo impide al importar.
create unique index if not exists trivia_questions_pregunta_key
  on trivia_questions (lower(btrim(pregunta)));

create index if not exists trivia_questions_tema_idx
  on trivia_questions (tema) where activa;

comment on table trivia_questions is
  'Preguntas del trivial. Una fila por pregunta; `tema` es el nivel del modo.';

-- Las 24 preguntas de una partida ---------------------------------------
--
-- Existe como función porque PostgREST no sabe pedir "ordenado al azar", y la
-- alternativa era traerse las quinientas y barajarlas en JavaScript: quinientas
-- filas por el cable para usar veinticuatro.
--
-- `tablesample` no vale aquí: da un porcentaje aproximado de la tabla entera y
-- no se puede filtrar por tema antes. Con estos volúmenes `order by random()`
-- es instantáneo.
create or replace function trivia_round(p_tema text, p_limit integer default 24)
returns setof trivia_questions
language sql
stable
as $$
  select *
    from trivia_questions
   where activa
     and (p_tema is null or tema = p_tema)
   order by random()
   limit least(greatest(coalesce(p_limit, 24), 1), 100);
$$;

comment on function trivia_round(text, integer) is
  'Preguntas al azar de un tema. Con p_tema null, de todos.';

-- Cuántas preguntas hay de cada tema, para poder avisar en el menú de los
-- temas que todavía se quedan cortos.
create or replace function trivia_counts()
returns table (tema text, total bigint)
language sql
stable
as $$
  select tema, count(*) from trivia_questions where activa group by tema;
$$;

-- Seguridad: como el resto. La app entra con la service role key desde el
-- servidor, así que RLS activo y sin políticas = el navegador no lo toca. Y las
-- funciones no se le abren a nadie más, o cualquiera podría descargarse el
-- cuestionario entero con las respuestas.
alter table trivia_questions enable row level security;

revoke all on function trivia_round(text, integer)  from public, anon, authenticated;
revoke all on function trivia_counts()              from public, anon, authenticated;
grant execute on function trivia_round(text, integer) to service_role;
grant execute on function trivia_counts()             to service_role;

commit;
