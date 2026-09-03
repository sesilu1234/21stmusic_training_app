import Link from "next/link";
import { Flame, Hammer, Lock, Medal } from "lucide-react";
import AppShell from "./components/AppShell";
import { gameIcons } from "./components/gameIcons";
import { categoryOf, gamesByCategory, type GameMode } from "@/lib/games";
import { currentStudent } from "@/lib/session";
import { getProgress, type GameProgress } from "@/lib/progress";

/**
 * Tarjeta de modo. Si el modo es de alumnos y no hay sesión, sigue siendo un
 * enlace (para que se pueda ver de qué va y ofrecer entrar), pero se enseña
 * apagada y con candado: se ve que existe, se ve que está cerrada.
 */
const GameCard = ({
  game,
  locked,
  stat,
}: {
  game: GameMode;
  locked: boolean;
  /** Lo que lleva hecho el alumno en este modo. Null si no lo ha tocado. */
  stat?: GameProgress;
}) => {
  const category = categoryOf(game.category);
  const Icon = gameIcons[game.icon];

  // Sin construir todavía: se enseña, pero no lleva a ningún sitio.
  if (game.comingSoon) {
    return (
      <div
        aria-disabled
        className="relative block cursor-default rounded-2xl border border-dashed border-white/[0.09] bg-slate-950/30 p-4 shadow-lg md:p-5"
      >
        <span
          title="Todavía sin construir"
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-slate-900/80 text-white/30"
        >
          <Hammer size={12} strokeWidth={2.25} />
        </span>

        <div className="flex items-start gap-3.5 opacity-35 grayscale">
          <span
            className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl ${category.iconBg}`}
          >
            <Icon size={22} className={category.accent} strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black uppercase italic leading-tight tracking-tight text-white">
              {game.label}
            </span>
            <span className="mt-1.5 block text-xs leading-snug text-white/45">
              {game.desc}
            </span>
          </span>
        </div>

        <span className="mt-3 block text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
          Próximamente
        </span>
      </div>
    );
  }

  return (
    <Link
      href={locked ? "/login" : game.slug}
      aria-label={locked ? `${game.label} — solo para alumnos` : game.label}
      className={`group relative block rounded-2xl border p-4 shadow-lg transition duration-200 md:p-5 ${
        locked
          ? "border-white/[0.06] bg-slate-950/40 hover:border-amber-300/30 hover:bg-slate-950/60"
          : `border-white/10 bg-slate-950/70 hover:-translate-y-0.5 hover:bg-slate-950/85 ${category.hoverBorder}`
      }`}
    >
      {locked && (
        <span
          title="Solo para alumnos de la escuela"
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-slate-900/80 text-white/40 transition-colors group-hover:border-amber-300/40 group-hover:text-amber-300"
        >
          <Lock size={12} strokeWidth={2.25} />
        </span>
      )}

      <div className={`flex items-start gap-3.5 ${locked ? "opacity-45 grayscale" : ""}`}>
        <span
          className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl transition-transform duration-200 ${
            locked ? "" : "group-hover:scale-105"
          } ${category.iconBg}`}
        >
          <Icon size={22} className={category.accent} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-black uppercase italic leading-tight tracking-tight text-white">
            {game.label}
          </span>
          <span className="mt-1.5 block text-xs leading-snug text-white/45">
            {game.desc}
          </span>
        </span>
      </div>

      {/* Con sesión, la tarjeta cuenta por dónde vas. La misma cifra que el
          panel de progreso: la media de los récords de cada nivel. */}
      {!locked && stat && (
        <span className="mt-3 flex items-center gap-2">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <span
              className={`block h-full rounded-full ${
                stat.mastery >= 90
                  ? "bg-emerald-400"
                  : stat.mastery >= 60
                    ? "bg-amber-400"
                    : "bg-rose-400"
              }`}
              style={{ width: `${stat.mastery}%` }}
            />
          </span>
          <span className="flex-shrink-0 text-[9px] font-black tracking-wider text-white/40">
            {stat.mastery}%
          </span>
          {/* Cuántos niveles del modo llevas clavados del todo (pleno en
              partida larga). Es un contador y no un icono suelto porque una
              medalla no se pierde: si mañana el modo estrena un nivel, lo que ya
              está ganado sigue ganado y solo hay uno más al que llegar.

              Cuando están todas, el chip se enciende: el modo rematado merece
              notarse, que es lo único bueno que tenía la medalla de sí o no. */}
          {stat.medals > 0 && (
          <span
  className={`flex flex-shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none tabular-nums ${
    stat.hasMedal
      ? "bg-amber-400/20 text-amber-200"
      : "text-amber-300/60"
  }`}
  title={`${stat.medals} de ${stat.medalsTotal} ${
    stat.medalsTotal === 1 ? "nivel clavado" : "niveles clavados"
  }`}
>
  <span className="leading-none pt-[2px]">{stat.medals}</span>
  <Medal size={11} className="shrink-0" />
</span>
          )}
        </span>
      )}

      {locked && (
        <span className="mt-3 block text-[9px] font-black uppercase tracking-[0.18em] text-amber-300/50 transition-colors group-hover:text-amber-300/90">
          Solo alumnos · entra para abrirlo
        </span>
      )}
    </Link>
  );
};

export default async function HomePage() {
  const student = await currentStudent();

  // El progreso es un extra: si la consulta falla, el menú tiene que salir
  // igual, solo que sin las marcas de cada tarjeta.
  const progress = student ? await getProgress(student.email).catch(() => null) : null;
  const statOf = (name: string) =>
    progress?.games.find((entry) => entry.game.name === name);


  return (
    <AppShell displayName={student?.displayName} role={student?.role}>
      <div className="mx-auto w-full max-w-5xl">
        {progress && progress.attempts > 0 && (
          <Link
            href="/progreso"
            className="mb-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-lg transition hover:border-amber-300/40"
          >
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-orange-400/15">
              <Flame size={17} className="text-orange-300" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black tracking-tight text-white">
                {progress.streak.current === 0
                  ? "Vuelve a empezar una racha"
                  : progress.streak.current === 1
                    ? "1 día seguido"
                    : `${progress.streak.current} días seguidos`}
              </span>
              <span className="block truncate text-[10px] text-white/35">
                {progress.streak.playedToday
                  ? `Hoy ya has practicado${progress.weekEmpty ? "" : ` · ${progress.weekAccuracy}% de aciertos esta semana`}`
                  : "Con una partida de hoy la mantienes viva"}
              </span>
            </span>
            <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
              Ver progreso
            </span>
          </Link>
        )}

        <div className="space-y-8 md:space-y-9">
          {gamesByCategory().map(({ category, games }) => (
            <section key={category.id}>
              <div className="mb-4 flex items-baseline gap-3">
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${category.dot}`} />
                <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-white/75">
                  {category.label}
                </h2>
                <span className="hidden truncate text-[10px] text-white/25 sm:inline">
                  {category.hint}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-3.5">
                {games.map((game) => (
                  <GameCard
                    key={game.name}
                    game={game}
                    locked={Boolean(game.studentsOnly) && !student}
                    stat={statOf(game.name)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
