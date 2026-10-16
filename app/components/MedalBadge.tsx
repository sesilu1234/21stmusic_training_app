/**
 * La medalla del progreso: cinta y disco dorado, dibujada aquí en vez del icono
 * genérico de lucide, que a 11px no parecía un premio sino un adorno.
 *
 * Los degradados de un SVG van por id, y si dos medallas de la página usan el
 * mismo id se pisan. Por eso cada una recibe el suyo (`id`), sacado de algo
 * que ya es único en la página, como el nombre del modo.
 */

const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");

/** Outfit, cargada en el layout (`medalFont` en app/fonts.ts). */
const MEDAL_FONT = { fontFamily: "var(--font-medal), sans-serif" };

/**
 * Lo que va dentro del disco parece acuñado en el oro: color de bronce oscuro,
 * un filo claro debajo (la luz que pilla el borde inferior del hueco) y una
 * sombra fina arriba (el borde superior, que queda a la sombra).
 */
const ENGRAVED_COLOR = "#78350f";
const ENGRAVED_TEXT = {
  color: ENGRAVED_COLOR,
  textShadow:
    "0 1px 0 rgba(254,243,199,0.75), 0 -0.5px 0 rgba(69,26,3,0.45)",
};
const ENGRAVED_FILTER =
  "drop-shadow(0 1px 0 rgba(254,243,199,0.75)) drop-shadow(0 -0.5px 0 rgba(69,26,3,0.45))";

function MedalSvg({
  id,
  size,
  className = "",
}: {
  id: string;
  size: number;
  className?: string;
}) {
  const gold = `medal-gold-${safeId(id)}`;
  const shine = `medal-shine-${safeId(id)}`;

  return (
    <svg
      width={size}
      height={(size * 56) / 48}
      viewBox="0 0 48 56"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id={shine} cx="0.35" cy="0.3" r="0.6">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* La cinta: dos tiras que bajan hasta el disco. */}
      <polygon points="9,0 21,0 28,24 16,24" fill="#7c3aed" />
      <polygon points="39,0 27,0 20,24 32,24" fill="#a78bfa" />
      <polygon points="21,0 27,0 24,10" fill="#5b21b6" opacity="0.6" />

      {/* El disco, con su canto y un brillo arriba a la izquierda. */}
      <circle cx="24" cy="36" r="17" fill="#92400e" />
      <circle cx="24" cy="35" r="16" fill={`url(#${gold})`} />
      <circle
        cx="24"
        cy="35"
        r="12"
        fill="none"
        stroke="#fef3c7"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      <circle cx="24" cy="35" r="16" fill={`url(#${shine})`} />
    </svg>
  );
}

/** Una estrella de cinco puntas centrada en una caja de 24×24. */
const STAR =
  "12,3.2 14.4,8.6 20.3,9.1 15.8,13 17.2,18.8 12,15.7 6.8,18.8 8.2,13 3.7,9.1 9.6,8.6";

const Star = ({ size, engraved = false }: { size: number; engraved?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={engraved ? { filter: ENGRAVED_FILTER } : undefined}
    aria-hidden
  >
    <polygon points={STAR} fill={ENGRAVED_COLOR} />
  </svg>
);

/**
 * Lo que va dentro del disco, encima del dibujo. Va en HTML y no como texto
 * del SVG para que el número use su tipografía. El centro del disco cae
 * al 62% del alto de la medalla (35 de 56).
 */
const DiscContent = ({ children }: { children: React.ReactNode }) => (
  <span className="absolute inset-x-0 top-[62%] grid -translate-y-1/2 place-items-center">
    {children}
  </span>
);

/** La medalla pequeña, la de cada nivel de la lista. */
export function LevelMedal({ id }: { id: string }) {
  return (
    <span
      title="Pleno en este nivel"
      className="relative inline-flex flex-shrink-0"
    >
      <MedalSvg
        id={id}
        size={13}
        className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
      />
      <DiscContent>
        <Star size={6} />
      </DiscContent>
      <span className="sr-only">Pleno en este nivel</span>
    </span>
  );
}

/**
 * El galardón de un modo, arriba a la derecha de su tarjeta: la medalla con
 * cuántos niveles llevas clavados dentro, y debajo de cuántos ("/8"). Con
 * todos brilla. Los modos sin niveles (armaduras, trivia…) llevan una estrella.
 */
export function MedalAward({
  id,
  count,
  total,
  size = 32,
  sticker = false,
}: {
  id: string;
  count: number;
  total: number;
  size?: number;
  /** Para `MedalSticker`: el "/8" va en una pastilla, que se lea sobre lo que caiga. */
  sticker?: boolean;
}) {
  const scale = size / 32;
  const complete = count >= total;
  const label = `${count} de ${total} ${total === 1 ? "nivel clavado" : "niveles clavados"}`;

  return (
    <span className="flex flex-col items-center" title={label}>
      <span className="relative inline-flex">
        <MedalSvg
          id={id}
          size={size}
          className={
            complete
              ? "drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]"
              : "drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)]"
          }
        />
        <DiscContent>
          {total > 1 ? (
            <span
              className="font-bold leading-none tabular-nums"
              style={{ ...MEDAL_FONT, ...ENGRAVED_TEXT, fontSize: 13 * scale }}
            >
              {count}
            </span>
          ) : (
            <Star size={13 * scale} engraved />
          )}
        </DiscContent>
      </span>

      {total > 1 && (
        <span
          className={`mt-0.5 text-[9px] font-bold leading-none tabular-nums ${
            complete ? "text-amber-200" : sticker ? "text-white/70" : "text-white/45"
          } ${
            sticker
              ? "rounded-full bg-slate-950/90 px-1.5 py-[3px] shadow-[0_2px_4px_rgba(0,0,0,0.5)] ring-1 ring-amber-300/30"
              : ""
          }`}
          style={MEDAL_FONT}
        >
          /{total}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * El galardón como pegatina: sobresale por la esquina de arriba a la derecha
 * de la tarjeta, como algo que se ha ganado y se le ha pegado
 * encima, no como parte del dibujo de la tarjeta.
 *
 * Va con `absolute`, así que la tarjeta tiene que ser `relative`. Y no lleva
 * eventos de ratón: tapa un trozo de la tarjeta y el clic tiene que seguir
 * llegando al enlace.
 */
export function MedalSticker(props: { id: string; count: number; total: number }) {
  return (
    <span className="pointer-events-none absolute -right-3 -top-4 z-10">
      <MedalAward {...props} size={42} sticker />
    </span>
  );
}
