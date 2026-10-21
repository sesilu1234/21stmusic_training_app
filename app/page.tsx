import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Hammer, Lock } from "lucide-react";
import AppShell from "./components/AppShell";
import GamePreview from "./components/GamePreview";
import HonorStrip from "./components/HonorStrip";
import { MedalSticker } from "./components/MedalBadge";
import { categoryOf, gamesByCategory, type GameMode } from "@/lib/games";
import { currentStudent } from "@/lib/session";
import { getProgress, type GameProgress } from "@/lib/progress";
import { getHonorBoard, HONOR_MIN_PARTICIPANTS } from "@/lib/honor";
import { HONOR_ENABLED } from "@/lib/site";
import { SITE_URL } from "@/lib/seo";

/**
 * La canónica de la portada, que antes estaba en el layout raíz.
 *
 * Ahí valía para esta página y mentía en todas las demás, porque los metadatos
 * se heredan: cualquier ruta sin `alternates` propio salía diciendo que la
 * página buena era esta. Puesta aquí solo habla de quien la declara.
 *
 * Título y descripción no hacen falta: los del layout raíz ya son los de la
 * portada, que es de donde salen los valores por defecto.
 */
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

/**
 * La miniatura del modo, en el sitio donde iba el icono: un trocito del
 * ejercicio dibujado en tinta sobre papel (ver `GamePreview`).
 */
const Thumb = ({ name, hover = false }: { name: string; hover?: boolean }) => (
  <span
    className={`block aspect-[2/1] w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#f4efe4] transition-transform duration-200 ${
      hover ? "group-hover:scale-105" : ""
    }`}
  >
    <GamePreview name={name} className="h-full w-full" />
  </span>
);

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
          <Thumb name={game.name} />
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

  const hasAward = !locked && stat !== undefined && stat.medals > 0;

  return (
    <Link
      href={locked ? "/login" : game.slug}
      aria-label={locked ? `${game.label} — solo para alumnos` : game.label}
      /* Sube con `top` y no con translate: un transform pasa la tarjeta a su
         propia capa y el navegador suaviza el texto de otra forma, con lo que el
         número grabado de la medalla adelgaza y pierde el relieve en el hover. */
      className={`group relative top-0 block rounded-2xl border p-4 shadow-lg transition-all duration-200 md:p-5 ${
        locked
          ? "border-white/[0.06] bg-slate-950/40 hover:border-amber-300/30 hover:bg-slate-950/60"
          : `border-white/10 bg-slate-950/70 hover:-top-0.5 hover:bg-slate-950/85 ${category.hoverBorder}`
      }`}
    >
      {/* El galardón: cuántos niveles del modo llevas clavados del todo (pleno
          en partida larga), pegado encima de la esquina de arriba a la derecha
          y saliéndose de ella, como una pegatina. Es un contador
          y no un sí/no porque una medalla no se pierde: si mañana el modo
          estrena un nivel, lo ganado sigue ganado y solo hay uno más al que
          llegar. Con todos, brilla. */}
      {hasAward && (
        <MedalSticker id={game.name} count={stat.medals} total={stat.medalsTotal} />
      )}

      {locked && (
        <span
          title="Solo para alumnos de la escuela"
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-slate-900/80 text-white/40 transition-colors group-hover:border-amber-300/40 group-hover:text-amber-300"
        >
          <Lock size={12} strokeWidth={2.25} />
        </span>
      )}

      <div
        className={`flex items-start gap-3.5 ${locked ? "opacity-45 grayscale" : ""} ${
          hasAward ? "pr-7" : ""
        }`}
      >
        <Thumb name={game.name} hover={!locked} />
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
  // Lo mismo con el cuadro de honor, que además solo se enseña con sesión:
  // son nombres de alumnos.
  const [progress, honor] = student
    ? await Promise.all([
        getProgress(student.email).catch(() => null),
        HONOR_ENABLED ? getHonorBoard(student.email).catch(() => null) : null,
      ])
    : [null, null];
  const statOf = (name: string) =>
    progress?.games.find((entry) => entry.game.name === name);


  return (
    <AppShell displayName={student?.displayName} role={student?.role}>
      <div className="mx-auto w-full max-w-5xl">
        {progress && progress.attempts > 0 && (
          <Link
            href="/progreso"
            className="group mb-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-lg transition hover:border-amber-300/40"
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
            <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.18em] text-white/30 transition-colors group-hover:text-white/70">
              Ver progreso
            </span>
          </Link>
        )}

        {/* Con un solo apuntado la franja sería tu nombre y nada más. */}
        {student && honor && honor.participants >= HONOR_MIN_PARTICIPANTS && (
          <HonorStrip board={honor} showInHonor={student.showInHonor} />
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
