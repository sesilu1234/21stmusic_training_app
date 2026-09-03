import Link from "next/link";
import { Flame, Medal, Target, Trophy } from "lucide-react";
import { gameIcons } from "@/app/components/gameIcons";
import { CATEGORIES, categoryOf, labelForStoredName } from "@/lib/games";
import { dayKey, FORM_WINDOW, type GameProgress, type Progress } from "@/lib/progress";

/** "hoy", "ayer", "hace 3 días", "12 mar". */
const whenLabel = (iso: string) => {
  const today = new Date();
  const day = dayKey(new Date(iso));

  const shift = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return dayKey(date);
  };

  if (day === shift(0)) return "hoy";
  if (day === shift(1)) return "ayer";
  for (let days = 2; days <= 6; days++) {
    if (day === shift(days)) return `hace ${days} días`;
  }
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

/** El nivel, tal cual sale en la URL, escrito para leerlo: "Sol naturales". */
const titleCase = (text: string) => {
  const words = text.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * "modulo3" -> "Modulo3"; "nombrar/triadas" -> "Nombrar · Triadas".
 *
 * El submodo no se puede tirar. Antes se hacía `slug.split("/").pop()`, y en
 * acordes en el pentagrama eso deja "Mayores menores" dos veces seguidas —
 * una de nombrar y otra de escribir — sin nada que las distinga. Se notaba poco
 * mientras solo salían los niveles jugados; ahora que salen todos, se ve.
 */
const levelLabel = (slug: string) =>
  slug.split("/").map(titleCase).join(" · ");

const barColor = (value: number) =>
  value >= 90 ? "bg-emerald-400" : value >= 60 ? "bg-amber-400" : "bg-rose-400";

const Tile = ({
  icon,
  value,
  label,
  hint,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-sm">
    <div className="flex items-center gap-2 text-white/40">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p
      className="mt-2 text-3xl font-black italic tracking-tighter text-white"
      style={{ fontFamily: "Chaney, sans-serif" }}
    >
      {value}
    </p>
    {hint && <p className="mt-1 text-[10px] text-white/30">{hint}</p>}
  </div>
);

/** Un modo dentro del panel de su categoría. */
const GameRow = ({ entry }: { entry: GameProgress }) => {
  const palette = categoryOf(entry.game.category);
  const Icon = gameIcons[entry.game.icon];

  // Un modo sin estrenar se apaga, igual que un nivel sin estrenar. No es un
  // suspenso: es un "por aquí no has pasado todavía", y si se pintara con el
  // mismo peso que los demás el panel sería una lista de ceros en la que no se
  // distingue lo que llevas de lo que te queda.
  const untouched = entry.attempts === 0;

  return (
    <li
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 ${
        untouched ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${palette.iconBg}`}
        >
          <Icon size={17} className={palette.accent} strokeWidth={1.75} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={entry.game.slug}
              className="truncate text-sm font-black tracking-tight text-white transition hover:text-amber-300"
            >
              {entry.game.label}
            </Link>
            {/* Las medallas del modo son las de sus niveles, contadas. Cuando
                están todas el chip se enciende. Cuáles son se ve abajo, en la
                lista de niveles. */}
            {entry.medals > 0 && (
              <span
                className={`flex flex-shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  entry.hasMedal
                    ? "bg-amber-400/20 text-amber-200"
                    : "text-amber-300/60"
                }`}
                aria-label={`${entry.medals} de ${entry.medalsTotal} niveles clavados`}
              >
                {entry.medals}
                <Medal size={11} />
              </span>
            )}
          </div>

          {/* La barra dice cuánto llevas dominado del modo: la suma de los
              récords de cada nivel repartida entre los niveles que el modo
              tiene, no entre los que has jugado. Antes se dividía entre los
              jugados y por eso un solo nivel bordado daba 100%.

              Lo bien que lo haces no se pierde: está en la línea de abajo
              ("últimas 6: 87%"). Eran el mismo número y una de las dos lecturas
              tenía que mentir; ahora cada una dice lo suyo. */}
          <div className="mt-2 flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${barColor(entry.mastery)}`}
                style={{ width: `${entry.mastery}%` }}
              />
            </div>
            <span className="w-9 flex-shrink-0 text-right text-[11px] font-black text-white/70">
              {entry.mastery}%
            </span>
          </div>

          <p className="mt-1.5 text-[10px] text-white/30">
            {untouched ? (
              // Sin partidas no hay nada que resumir: "0 de 6 niveles · 0
              // partidas" son tres ceros para decir una sola cosa.
              <>
                Sin empezar
                {entry.levelsTotal !== null && ` · ${entry.levelsTotal} niveles`}
              </>
            ) : (
              <>
                {/* Cuántos niveles llevas tocados, primero del todo: es lo que
                    explica un porcentaje bajo cuando estás jugando bien, y sin
                    ello la barra parece una nota en vez de un recorrido. */}
                {entry.levelsTotal !== null &&
                  `${entry.levelsPlayed} de ${entry.levelsTotal} niveles · `}
                {entry.attempts} {entry.attempts === 1 ? "partida" : "partidas"}
                {entry.attempts > 1 &&
                  ` · últimas ${Math.min(entry.attempts, FORM_WINDOW)}: ${entry.form}%`}
                {entry.lastPlayedAt && ` · ${whenLabel(entry.lastPlayedAt)}`}
              </>
            )}
          </p>

          {/* Los niveles solo se enseñan si el modo tiene más de uno: en los
              demás sería repetir la línea de arriba con otras palabras.

              Salen TODOS, incluidos los que no se han tocado, apagados y a 0%.
              Son los que explican la barra del modo: sin ellos, un 60% con
              cuatro niveles bordados a la vista no cuadra con nada, y encima se
              pierde lo único que dice qué queda por hacer.

              Llevan sus dos cifras, igual que el modo: el récord del nivel y
              cómo lo lleva últimamente. Sin la cabecera de arriba, dos números
              seguidos no se sabe qué son. */}
          {entry.levels.length > 1 && (
            <ul className="mt-2.5 space-y-1 border-l border-white/10 pl-3">
              <li className="flex items-center gap-2 text-[8px] uppercase tracking-[0.14em] text-white/25">
                <span className="min-w-0 flex-1" />
                <span className="w-14 text-right">Récord</span>
                <span className="w-10 text-right">Últimas</span>
              </li>

              {entry.levels.map((level) => {
                const untouched = level.attempts === 0;

                return (
                  <li
                    key={level.slug}
                    className={`flex items-center gap-2 ${untouched ? "opacity-45" : ""}`}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="min-w-0 truncate text-[10px] text-white/40">
                        {levelLabel(level.slug)}
                      </span>
                      {/* Medalla del nivel: pleno en partida larga, el mismo
                          listón que la del modo. */}
                      {level.hasMedal && (
                        <Medal
                          size={10}
                          className="flex-shrink-0 text-amber-300"
                          aria-label="Pleno en este nivel"
                        />
                      )}
                    </span>
                    <span className="flex w-14 items-center justify-end gap-1.5">
                      <span className="h-1 w-8 overflow-hidden rounded-full bg-white/10">
                        {!untouched && (
                          <span
                            className={`block h-full rounded-full ${barColor(level.best)}`}
                            style={{ width: `${level.best}%` }}
                          />
                        )}
                      </span>
                      <span className="text-[10px] font-bold text-white/45">
                        {untouched ? "—" : `${level.best}%`}
                      </span>
                    </span>
                    <span className="w-10 text-right text-[10px] text-white/25">
                      {untouched ? "—" : `${level.form}%`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
};

export default function ProgressBoard({
  displayName,
  progress,
}: {
  displayName: string;
  progress: Progress;
}) {
  const { streak } = progress;

  // Las dos últimas semanas, de la más antigua a hoy: se ve de un vistazo si
  // se practica a diario o a ratones.
  const lastDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = dayKey(date);
    return { key, played: streak.days.includes(key) };
  });

  if (!progress.attempts) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 text-center backdrop-blur-sm">
        <h2 className="text-xl font-black italic tracking-tight text-white">
          Todavía no hay nada que contar
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45">
          En cuanto termines una partida, aquí se irá guardando por dónde vas en
          cada modo, cuántos días seguidos practicas y las medallas que sacas.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-amber-400 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-amber-300"
        >
          Elegir un modo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          icon={<Flame size={13} className="text-orange-300" />}
          label="Racha"
          value={`${streak.current} ${streak.current === 1 ? "día" : "días"}`}
          hint={
            streak.playedToday
              ? `Récord: ${streak.best}`
              : streak.current > 0
                ? "Juega hoy para no perderla"
                : "Empieza una hoy"
          }
        />
        {/* De la última semana y no de siempre: la media de toda la vida
            castiga por haber empezado sin saber, y el alumno que ha mejorado
            no lo ve moverse en meses. */}
        <Tile
          icon={<Target size={13} />}
          label="Aciertos · 7 días"
          value={progress.weekEmpty ? "—" : `${progress.weekAccuracy}%`}
          hint={
            progress.weekEmpty
              ? "Sin partidas esta semana"
              : `${progress.weekCorrect} de ${progress.weekQuestions}`
          }
        />
        <Tile
          icon={<Trophy size={13} />}
          label="Partidas"
          value={String(progress.attempts)}
          hint={`${streak.days.length} días practicando`}
        />
        <Tile
          icon={<Medal size={13} className="text-amber-300" />}
          label="Medallas"
          value={String(progress.medals)}
          hint="Niveles clavados: partida larga sin fallar"
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-sm">
        <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
          Últimas dos semanas
        </p>
        <div className="flex items-end gap-1.5">
          {lastDays.map((day) => (
            <span
              key={day.key}
              title={day.key}
              className={`h-7 flex-1 rounded-md ${
                day.played ? "bg-amber-400/80" : "bg-white/[0.06]"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Un panel por familia, en el orden del menú: así el progreso se lee
          igual que se navega. */}
      {CATEGORIES.map((category) => {
        const games = progress.games.filter(
          (entry) => entry.game.category === category.id,
        );
        if (!games.length) return null;

        return (
          <section
            key={category.id}
            className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 backdrop-blur-sm md:p-5"
          >
            <div className="mb-3.5 flex items-baseline gap-3">
              <span className={`h-1.5 w-1.5 rounded-full ${category.dot}`} />
              <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-white/75">
                {category.label}
              </h2>
            </div>

            <ul className="space-y-2.5">
              {games.map((entry) => (
                <GameRow key={entry.game.name} entry={entry} />
              ))}
            </ul>
          </section>
        );
      })}

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 backdrop-blur-sm md:p-5">
        <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-white/75">
          Últimas partidas
        </h2>
        <ul className="divide-y divide-white/[0.06]">
          {progress.recent.map((attempt, index) => {
            const pct = Math.round((attempt.correct / attempt.total) * 100);
            return (
              <li
                key={`${attempt.createdAt}-${index}`}
                className="flex items-center gap-3 py-2.5"
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
                  {whenLabel(attempt.createdAt)}
                </span>
                <span
                  className={`w-16 flex-shrink-0 text-right text-xs font-black ${
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

      {/* Decía "esto solo lo ves tú", y no era verdad: está en la base de
          datos de la escuela y el profesorado puede consultarlo.

          Y el aviso de las partidas terminadas, porque si no la cuenta de
          partidas no cuadra con lo que uno recuerda haber jugado. */}
      <div className="space-y-1 pb-2 text-center text-[10px] leading-4 text-white/25">
        <p>
          Solo cuentan las partidas terminadas: si dejas una a medias o cierras
          la página, esa no se guarda.
        </p>
      </div>
    </div>
  );
}
