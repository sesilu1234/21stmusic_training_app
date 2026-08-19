// Escalones de medalla.
//
// Antes la medalla era binaria: un pleno y ya está, ese modo dejaba de dar
// nada para siempre. Ahora el primer pleno da bronce y seguir jugando sube el
// escalón, así que los modos ya completados siguen teniendo recorrido.

/** Una partida solo cuenta para medalla si tiene al menos esta longitud. */
export const MEDAL_MIN_LENGTH = 24;

export type TierId = "ninguna" | "bronce" | "plata" | "oro";

export interface Tier {
  id: TierId;
  label: string;
  /** plenos necesarios para alcanzarlo */
  plenos: number;
  /** Clases tailwind fijas: no interpolar. */
  text: string;
  border: string;
  bg: string;
  glow: string;
}

export const TIERS: Tier[] = [
  {
    id: "bronce",
    label: "Bronce",
    plenos: 1,
    text: "text-orange-300",
    border: "border-orange-400/35",
    bg: "bg-orange-400/10",
    glow: "shadow-[0_8px_30px_rgba(251,146,60,0.10)]",
  },
  {
    id: "plata",
    label: "Plata",
    plenos: 5,
    text: "text-slate-200",
    border: "border-slate-300/40",
    bg: "bg-slate-300/10",
    glow: "shadow-[0_8px_30px_rgba(226,232,240,0.10)]",
  },
  {
    id: "oro",
    label: "Oro",
    plenos: 15,
    text: "text-amber-300",
    border: "border-amber-300/45",
    bg: "bg-amber-400/12",
    glow: "shadow-[0_10px_38px_rgba(251,191,36,0.16)]",
  },
];

/** El escalón alcanzado con N plenos, o null si todavía no hay ninguno. */
export const tierFor = (plenos: number): Tier | null => {
  let reached: Tier | null = null;
  for (const tier of TIERS) if (plenos >= tier.plenos) reached = tier;
  return reached;
};

/** El siguiente escalón y cuántos plenos faltan. null si ya está el oro. */
export const nextTier = (plenos: number) => {
  const upcoming = TIERS.find((tier) => plenos < tier.plenos);
  return upcoming ? { tier: upcoming, missing: upcoming.plenos - plenos } : null;
};
