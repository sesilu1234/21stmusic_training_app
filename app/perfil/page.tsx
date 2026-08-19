import Link from "next/link";
import { Award, Gamepad2, Target } from "lucide-react";
import AppShell from "../components/AppShell";
import Avatar from "../components/Avatar";
import { requireStudent } from "@/lib/session";
import { getStudentStats, listMedals } from "@/lib/students";
import { gameLabel } from "@/lib/games";
import { formatDate, formatMonth } from "@/lib/format";

export const metadata = { title: "Tu perfil · 21st Century Music" };

export default async function PerfilPage() {
  const { student, image } = await requireStudent();
  const [medals, stats] = await Promise.all([
    listMedals(student.email),
    getStudentStats(student.email),
  ]);

  const tiles = [
    { label: "Partidas", value: stats.games, Icon: Gamepad2 },
    { label: "Aciertos", value: stats.points, Icon: Target },
    { label: "Medallas", value: medals.length, Icon: Award },
  ];

  return (
    <AppShell user={{ displayName: student.displayName, image, medals: medals.length }}>
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Cabecera: el "desde" va suelto arriba a la derecha, en letra fina.
            Metido en una tarjeta propia pesaba más de lo que aporta. */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-6 backdrop-blur-sm md:px-8 md:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl"
          />

          <p className="absolute right-5 top-5 text-[10px] font-light capitalize tracking-wide text-white/35 md:right-8 md:top-7">
            Desde {formatMonth(student.createdAt)}
          </p>

          <div className="relative flex flex-col items-start gap-4 pr-24 sm:flex-row sm:items-center sm:gap-6 sm:pr-28">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-amber-300/25 bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.45)] md:h-24 md:w-24">
              <Avatar
                src={image}
                name={student.displayName}
                size={96}
                className="h-full w-full text-3xl"
              />
            </div>

            {/* Sin truncate: los nombres largos se parten en dos líneas en vez
                de quedarse a medias con puntos suspensivos. */}
            <div className="min-w-0">
              <h1 className="text-xl font-black italic leading-tight tracking-tight [overflow-wrap:anywhere] md:text-3xl">
                {student.displayName}
              </h1>
              <p className="mt-1.5 text-xs font-light text-white/45 [overflow-wrap:anywhere]">
                {student.username ? `@${student.username}` : student.email}
              </p>
            </div>
          </div>

          <dl className="relative mt-7 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-5">
            {tiles.map(({ label, value, Icon }) => (
              <div key={label} className="px-2 text-center first:pl-0 last:pr-0">
                <dt className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                  <Icon size={12} className="text-amber-400/80" />
                  {label}
                </dt>
                <dd className="mt-1.5 text-2xl font-black tabular-nums text-white md:text-3xl">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 backdrop-blur-sm md:p-6">
          <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
            Mejores marcas
          </h2>

          {stats.byGame.length ? (
            <ul className="divide-y divide-white/5">
              {stats.byGame.map((stat) => (
                <li key={stat.game} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0 truncate text-sm text-white/80">
                    {gameLabel(stat.game)}
                  </span>
                  <span className="flex flex-shrink-0 items-baseline gap-2">
                    <span className="text-[10px] font-light text-white/35">
                      {stat.attempts} {stat.attempts === 1 ? "partida" : "partidas"}
                    </span>
                    <span className="text-sm font-black tabular-nums text-amber-300">
                      {stat.best}/{stat.bestTotal}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/45">
              Todavía no has terminado ninguna partida.{" "}
              <Link href="/" className="text-amber-300 underline-offset-2 hover:underline">
                Empieza por aquí
              </Link>
              .
            </p>
          )}
        </section>

        {stats.recent.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 backdrop-blur-sm md:p-6">
            <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
              Últimas partidas
            </h2>
            <ul className="divide-y divide-white/5">
              {stats.recent.map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-white/80">
                      {gameLabel(attempt.game)}
                    </span>
                    <span className="block text-[10px] font-light text-white/35">
                      {formatDate(attempt.createdAt)}
                    </span>
                  </span>
                  <span
                    className={`flex-shrink-0 text-sm font-black tabular-nums ${
                      attempt.correct === attempt.total ? "text-amber-300" : "text-white/60"
                    }`}
                  >
                    {attempt.correct}/{attempt.total}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
