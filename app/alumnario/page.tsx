import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Backdrop from "../components/Backdrop";
import { canSeeAlumnario } from "@/lib/roles";
import { currentStudent } from "@/lib/session";
import { getStudentAnyStatus, type Student } from "@/lib/students";
import { getProgress, FORM_WINDOW, type Progress } from "@/lib/progress";
import { labelForStoredName } from "@/lib/games";
import StudentSearch from "./StudentSearch";

/**
 * Alumnario: la actividad de un alumno, para quien da la clase.
 *
 * Hasta ahora el progreso se guardaba y solo lo veía cada alumno de sí mismo,
 * o sea que en una escuela no servía de nada: quien da la clase no podía mirar
 * por dónde va nadie.
 *
 * Entran los roles `admin` y `profesor` (ver `lib/roles`). Quien no, se
 * encuentra un `notFound()` y no un "no autorizado": un 401 confirma que la
 * ruta está ahí y que solo falta ser alguien, y esto no tiene por qué existir
 * para quien no puede entrar.
 *
 * Es de solo lectura a propósito. Desde aquí no se puede tocar nada: ni
 * contraseñas, ni altas, ni borrar partidas. Y los apuntes del alumno no se
 * enseñan: son suyos. Que solo lea es lo que permite dejarla en manos de
 * cualquiera con rol de profesor sin tener que pensarlo dos veces.
 */
export const metadata: Metadata = {
  title: "Alumnario · 21st Century Music",
  // Es una página de datos de alumnos: fuera de los buscadores.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const barColor = (value: number) =>
  value >= 90 ? "bg-emerald-400" : value >= 60 ? "bg-amber-400" : "bg-rose-400";

/** El nivel, tal cual sale en la URL, escrito para leerlo: "Sol naturales". */
const levelLabel = (slug: string) => {
  const clean = slug.split("/").pop() ?? slug;
  const words = clean.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const Tile = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
      {label}
    </p>
    <p
      className="mt-1.5 text-3xl font-black italic tracking-tighter text-white"
      style={{ fontFamily: "Chaney, sans-serif" }}
    >
      {value}
    </p>
    {hint && <p className="mt-0.5 text-[10px] text-white/30">{hint}</p>}
  </div>
);

/** La ficha: lo que el profesor viene a ver. */
const StudentReport = ({
  student,
  progress,
}: {
  student: Student;
  progress: Progress | null;
}) => {
  if (!progress) {
    return (
      <p className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-4 text-sm text-rose-200/80">
        No se ha podido leer el progreso de {student.displayName}.
      </p>
    );
  }

  const lastPlayed = progress.recent[0]?.createdAt ?? null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Partidas" value={String(progress.attempts)} />
        <Tile
          label="Aciertos · 7 días"
          value={progress.weekEmpty ? "—" : `${progress.weekAccuracy}%`}
          hint={progress.weekEmpty ? "sin partidas esta semana" : undefined}
        />
        <Tile
          label="Racha"
          value={`${progress.streak.current} d`}
          hint={`récord ${progress.streak.best}`}
        />
        <Tile label="Medallas" value={String(progress.medals)} />
      </div>

      <p className="text-xs leading-5 text-white/45">
        En la escuela desde {fmtDate(student.createdAt)}
        {lastPlayed
          ? ` · última partida el ${fmtDate(lastPlayed)}`
          : " · todavía no ha jugado"}
        {progress.streak.days.length > 0 &&
          ` · ${progress.streak.days.length} días distintos practicando`}
        {!student.isActive && " · cuenta desactivada"}
      </p>

      {progress.games.length === 0 ? (
        <p className="text-sm text-white/40">Todavía no ha terminado ninguna partida.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
            <table className="w-full min-w-[36rem] text-left text-xs">
              <thead className="bg-white/[0.04] text-[9px] uppercase tracking-[0.16em] text-white/35">
                <tr>
                  <th className="px-3.5 py-2.5 font-black">Modo</th>
                  <th className="px-3.5 py-2.5 font-black">Partidas</th>
                  <th className="px-3.5 py-2.5 font-black">Récord</th>
                  <th className="px-3.5 py-2.5 font-black">Últimas {FORM_WINDOW}</th>
                  <th className="px-3.5 py-2.5 font-black">Última vez</th>
                </tr>
              </thead>

              {/* Un `tbody` por modo: agrupa el modo con sus niveles, así la
                  línea que los separa cae donde empieza el siguiente modo y no
                  entre un módulo y otro del mismo. */}
              {progress.games.map((entry) => (
                <tbody
                  key={entry.game.name}
                  className="border-t border-white/[0.07] first-of-type:border-t-0"
                >
                  <tr className="transition hover:bg-white/[0.03]">
                    <td className="px-3.5 py-2.5 font-bold text-white/85">
                      {entry.game.label}
                      {entry.hasMedal && (
                        <span aria-label="con medalla" className="ml-1.5 text-amber-300">
                          ●
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-white/45">{entry.attempts}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                          <span
                            className={`block h-full rounded-full ${barColor(entry.mastery)}`}
                            style={{ width: `${entry.mastery}%` }}
                          />
                        </span>
                        <span className="font-black text-white/75">{entry.mastery}%</span>
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-white/45">{entry.form}%</td>
                    <td className="px-3.5 py-2.5 text-white/35">
                      {entry.lastPlayedAt ? fmtDate(entry.lastPlayedAt) : "—"}
                    </td>
                  </tr>

                  {/* Los niveles solo si hay más de uno: con uno sería repetir
                      la fila de arriba con otro nombre. */}
                  {entry.levels.length > 1 &&
                    entry.levels.map((level) => (
                      <tr key={level.slug} className="text-white/40">
                        <td className="py-1.5 pl-8 pr-3.5">
                          <span className="border-l border-white/10 pl-2.5">
                            {levelLabel(level.slug)}
                          </span>
                        </td>
                        <td className="px-3.5 py-1.5">{level.attempts}</td>
                        <td className="px-3.5 py-1.5">
                          <span className="flex items-center gap-2">
                            <span className="h-0.5 w-16 overflow-hidden rounded-full bg-white/[0.07]">
                              <span
                                className={`block h-full rounded-full ${barColor(level.best)} opacity-60`}
                                style={{ width: `${level.best}%` }}
                              />
                            </span>
                            <span className="font-bold">{level.best}%</span>
                          </span>
                        </td>
                        <td className="px-3.5 py-1.5">{level.form}%</td>
                        <td className="px-3.5 py-1.5 text-white/25">
                          {level.lastPlayedAt ? fmtDate(level.lastPlayedAt) : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              ))}
            </table>
          </div>

          {/* El histórico va después de la tabla, no antes: la tabla contesta
              "cómo lleva cada cosa" y esto contesta "qué ha hecho estos días",
              que es la pregunta de después. Con la hora, porque dos partidas
              del mismo día se distinguen por ahí. */}
          <section>
            <h3 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
              Últimas {progress.recent.length}{" "}
              {progress.recent.length === 1 ? "partida" : "partidas"}
            </h3>

            <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
              {progress.recent.map((attempt, index) => {
                const pct = Math.round((attempt.correct / attempt.total) * 100);
                return (
                  <li
                    key={`${attempt.createdAt}-${index}`}
                    className="flex items-center gap-3 px-3.5 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-white/80">
                        {labelForStoredName(attempt.gameName)}
                      </span>
                      {attempt.levelSlug && (
                        <span className="block truncate text-[10px] text-white/30">
                          {levelLabel(attempt.levelSlug)}
                        </span>
                      )}
                    </span>

                    <span className="flex-shrink-0 text-[10px] text-white/30">
                      {fmtDateTime(attempt.createdAt)}
                    </span>

                    <span
                      className={`w-14 flex-shrink-0 text-right text-xs font-black ${
                        pct === 100 ? "text-amber-300" : "text-white/60"
                      }`}
                    >
                      {attempt.correct}/{attempt.total}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="space-y-1.5 text-[11px] leading-4 text-white/35">
            <p>
              <span className="text-amber-300">●</span> Tiene la medalla del modo:
              una partida entera sin fallar.
            </p>
            {/* Aviso importante para no leer mal la tabla: aquí no hay ni rastro
                de lo que se deja a medias, porque la partida se guarda al llegar
                al marcador final. Alguien que abre un modo, falla dos y cierra el
                navegador no aparece por ningún lado. */}
            <p>
              Solo cuenta partidas terminadas. Si alguien deja una a medias o
              cierra el navegador, esa partida no se guarda y no sale aquí.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default async function AlumnoPage({
  searchParams,
}: {
  searchParams?: Promise<{ alumno?: string }>;
}) {
  const viewer = await currentStudent();
  if (!canSeeAlumnario(viewer?.role)) notFound();

  const params = (await searchParams) ?? {};

  const student = params.alumno ? await getStudentAnyStatus(params.alumno) : null;
  const progress = student ? await getProgress(student.email).catch(() => null) : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans text-white">
      <Backdrop />
      {/* Un velo más suave que el de las páginas de texto: aquí todo lo que se
          lee va dentro de una tarjeta con su propio fondo, así que la foto
          puede respirar sin quitarle contraste a nada. */}
      <div aria-hidden className="fixed inset-0 z-0 bg-slate-950/60" />
      {/* El mismo halo que la pantalla de acceso, para que las dos páginas de
          fuera de la app se reconozcan como de la misma casa. */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 left-1/2 z-0 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      <main className="relative z-10 px-5 py-12 md:py-16">
        <div className="mx-auto w-full max-w-4xl">
          {/* El volver va arriba a la derecha, enfrente del título: es una
              página a la que se entra desde el menú de la cuenta, así que hace
              falta una salida a la vista y no solo el botón del navegador. */}
          <header className="mb-7 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black italic tracking-tight md:text-4xl">
                Alumnario
              </h1>
              <p className="mt-1.5 text-xs text-white/40">
                Se muestra la actividad de un alumno.
              </p>
            </div>

            <Link
              href="/"
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/45 transition hover:border-white/25 hover:text-white"
            >
              <ArrowLeft size={12} />
              Volver
            </Link>
          </header>

          {/* El buscador va en su propia tarjeta, separado de la ficha. Antes
              compartían caja con una rayita en medio y parecían la misma cosa;
              son dos: la herramienta y el resultado. El `z-20` es para que el
              desplegable caiga POR ENCIMA de la ficha de abajo. */}
          <div className="relative z-20 rounded-2xl border border-white/10 bg-slate-950/70 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <StudentSearch selectedEmail={student?.email} />
          </div>

          {student ? (
            <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-6">
              <h2 className="mb-4 text-xl font-black tracking-tight text-white">
                {student.displayName}
              </h2>
              <StudentReport student={student} progress={progress} />
            </section>
          ) : (
            <p className="mt-8 text-center text-xs text-white/25">
              {params.alumno
                ? "No hay ningún alumno con ese correo."
                : "Escribe un nombre para empezar."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
