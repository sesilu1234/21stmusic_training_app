import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Backdrop from "../components/Backdrop";
import { INTERNAL_METADATA, isStaffKey } from "@/lib/internalKey";
import { getStudentAnyStatus, type Student } from "@/lib/students";
import { getProgress, FORM_WINDOW, type Progress } from "@/lib/progress";
import StudentSearch from "./StudentSearch";

/**
 * Alumnario: la actividad de un alumno, para quien da la clase.
 *
 * Hasta ahora el progreso se guardaba y solo lo veía cada alumno de sí mismo,
 * o sea que en una escuela no servía de nada: quien da la clase no podía mirar
 * por dónde va nadie.
 *
 * Se entra con `?key=…` y la clave sale de `STAFF_KEY` (ver `lib/internalKey`).
 * Sin clave buena la página no existe — `notFound()` y no un "no autorizado",
 * porque un 401 confirma que la ruta está ahí y que solo falta acertar.
 *
 * Es de solo lectura a propósito. Desde aquí no se puede tocar nada: ni
 * contraseñas, ni altas, ni borrar partidas. Y los apuntes del alumno no se
 * enseñan: son suyos. Una página que solo lee progreso no puede hacer daño si
 * la clave se filtra, y eso es lo que permite que la puerta sea una clave y no
 * un sistema de cuentas entero.
 */
export const metadata: Metadata = {
  title: "Alumnario · 21st Century Music",
  ...INTERNAL_METADATA,
};

export const dynamic = "force-dynamic";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const barColor = (value: number) =>
  value >= 90 ? "bg-emerald-400" : value >= 60 ? "bg-amber-400" : "bg-rose-400";

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
                  <th className="px-3.5 py-2.5 font-black">Dominio</th>
                  <th className="px-3.5 py-2.5 font-black">Últimas {FORM_WINDOW}</th>
                  <th className="px-3.5 py-2.5 font-black">Última vez</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {progress.games.map((entry) => (
                  <tr key={entry.game.name} className="transition hover:bg-white/[0.03]">
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Sin esto, el punto ámbar y la palabra "dominio" son adivinanzas.
              Va debajo de la tabla y no en un tooltip: se lee una vez, se
              entiende la tabla entera y no estorba después. */}
          <dl className="space-y-1.5 text-[11px] leading-4 text-white/35">
            <div className="flex gap-2">
              <dt className="flex-shrink-0 text-amber-300">●</dt>
              <dd>Tiene la medalla del modo: una partida entera sin fallar.</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 flex-shrink-0 font-bold text-white/50">Dominio</dt>
              <dd>
                Media de su mejor resultado en cada nivel jugado. No baja: es un
                récord. El 100% quiere decir pleno en todos los niveles que ha
                tocado.
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-16 flex-shrink-0 font-bold text-white/50">
                Últimas {FORM_WINDOW}
              </dt>
              <dd>
                Aciertos de sus últimas {FORM_WINDOW} partidas del modo. Esta sí
                sube y baja: es cómo lo lleva ahora.
              </dd>
            </div>
          </dl>
        </>
      )}
    </div>
  );
};

export default async function AlumnoPage({
  searchParams,
}: {
  searchParams?: Promise<{ key?: string; alumno?: string }>;
}) {
  const params = (await searchParams) ?? {};

  // Sin clave buena esta página no existe. Un 404 y no un 401: el "no
  // autorizado" confirma que la ruta está ahí y que solo falta acertar.
  if (!isStaffKey(params.key)) notFound();

  const key = String(params.key);

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
          <header className="mb-7">
            <h1 className="text-3xl font-black italic tracking-tight md:text-4xl">
              Alumnario
            </h1>
            <p className="mt-1.5 text-xs text-white/40">
              Se muestra la actividad de un alumno.
            </p>
          </header>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-6">
            <StudentSearch staffKey={key} selectedEmail={student?.email} />

            {student ? (
              <section className="mt-6 border-t border-white/[0.07] pt-6">
                <h2 className="mb-4 text-xl font-black tracking-tight text-white">
                  {student.displayName}
                </h2>
                <StudentReport student={student} progress={progress} />
              </section>
            ) : (
              <p className="mt-6 text-center text-xs text-white/25">
                {params.alumno
                  ? "No hay ningún alumno con ese correo."
                  : "Escribe un nombre para empezar."}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
