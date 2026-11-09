-- =====================================================================
-- Retos diarios: Eco y Pulso, los dos cada día
-- Ejecutar entero en el SQL editor de Supabase. Se puede repetir sin miedo.
-- Necesita db/eco.sql pasado antes.
-- =====================================================================
-- eco_plays guardaba una partida por alumno y día, porque solo había un reto.
-- Ahora hay dos (Eco, de memoria y oído; Pulso, de ritmo), cada uno con su
-- intento y su ranking, así que la partida lleva también de qué reto es.
--
-- Las partidas que ya había son todas de Eco: la columna nace con ese valor.
-- La tabla se sigue llamando eco_plays para no tener que migrar nada más.
--
-- Además, `score` ya no se escribe solo al acabar: se va guardando al
-- superar cada ronda, para que recargar a media partida no deje el día a 0.
-- Mientras se juega, finished_at sigue a null.
-- =====================================================================

begin;

alter table eco_plays
  add column if not exists kind text not null default 'eco';

alter table eco_plays drop constraint if exists eco_plays_kind_check;
alter table eco_plays
  add constraint eco_plays_kind_check check (kind in ('eco', 'pulso'));

-- La clave pasa de (alumno, día) a (alumno, día, reto).
alter table eco_plays drop constraint if exists eco_plays_pkey;
alter table eco_plays add primary key (student_email, day, kind);

drop index if exists eco_plays_day_idx;
create index if not exists eco_plays_day_kind_idx
  on eco_plays (day, kind, score desc);

comment on table eco_plays is
  'Retos diarios (Eco y Pulso): una fila por alumno, día y reto. La puntuación la calcula el servidor.';

commit;
