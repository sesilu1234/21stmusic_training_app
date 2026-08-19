import Link from "next/link";
import { Award, Gamepad2, Target } from "lucide-react";
import AppShell from "../components/AppShell";
import Avatar from "../components/Avatar";
import { requireStudent } from "@/lib/session";
import { getStudentStats, listMedals } from "@/lib/students";
import { gameLabel } from "@/lib/games";
import { formatDate, formatMonth } from "@/lib/format";

export const metadata = { title: "Tu perfil · 21st Century Music" };

const LOCAL_DOMAIN = "@21stcm.local";

export default async function PerfilPage() {
  const { student, image } = await requireStudent();
  const [medals, stats] = await Promise.all([
    listMedals(student.email),
    getStudentStats(student.email),
  ]);

  const hasRealEmail = !student.email.endsWith(LOCAL_DOMAIN);
  const accessLabel = hasRealEmail ? "Google" : "Usuario y contraseña";

  const tiles = [
    { label: "Partidas", value: stats.games, Icon: Gamepad2 },
    { label: "Aciertos", value: stats.points, Icon: Target },
    { label: "Medallas", value: medals.length, Icon: Award },
  ];

  return (
    <AppShell user={{ displayName: student.displayName, image, medals: medals.length }}>
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6 backdrop-blur-sm md:p-8">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-3xl border border-amber-300/25 bg-slate-900">
              <Avatar
                src={image}
                name={student.displayName}
                size={80}
                className="h-full w-full text-3xl"
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black italic tracking-tight md:text-3xl">
                {student.displayName}
              </h1>
              <p className="mt-1 truncate text-xs text-white/50">
                {student.username ? `@${student.username}` : student.email}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[9px] font-black uppercase tracking-[0.22em] text-white/40">
                Acceso
              </dt>
              <dd className="mt-1 text-sm text-white/85">{accessLabel}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <dt className="text-[9px] font-black uppercase tracking-[0.22em] text-white/40">
                En la academia desde
              </dt>
              <dd className="mt-1 text-sm capitalize text-white/85">
                {formatMonth(student.createdAt)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="grid grid-cols-3 gap-3">
          {tiles.map(({ label, value, Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-center"
            >
              <Icon size={16} className="mx-auto text-amber-400" />
              <div className="mt-2 text-2xl font-black text-white">{value}</div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                {label}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6">
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-amber-200">
            Mejores marcas
          </h2>

          {stats.byGame.length ? (
            <ul className="space-y-2">
              {stats.byGame.map((stat) => (
                <li
                  key={stat.game}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm text-white/85">{gameLabel(stat.game)}</span>
                  <span className="flex-shrink-0 text-right">
                    <span className="block text-sm font-black text-amber-300">
                      {stat.best}/{stat.bestTotal}
                    </span>
                    <span className="block text-[10px] text-white/40">
                      {stat.attempts} {stat.attempts === 1 ? "partida" : "partidas"}
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
          <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-6">
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-amber-200">
              Últimas partidas
            </h2>
            <ul className="space-y-2">
              {stats.recent.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-white/85">{gameLabel(attempt.game)}</span>
                    <span className="block text-[10px] uppercase tracking-[0.16em] text-white/35">
                      {formatDate(attempt.createdAt)}
                    </span>
                  </span>
                  <span
                    className={`flex-shrink-0 text-sm font-black ${
                      attempt.correct === attempt.total ? "text-amber-300" : "text-white/70"
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
