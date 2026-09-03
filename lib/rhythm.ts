// Motor del modo "Lectura rítmica": genera compases de 4/4 escritos como los
// escribiría un copista, no como salgan.
//
// Dos reglas mandan sobre todo lo demás:
//
//   1. El 3er tiempo se tiene que ver SIEMPRE. Es la mitad del compás y es la
//      referencia con la que el que lee se reengancha si se pierde. Ninguna
//      figura ni ningún silencio puede cruzarla.
//   2. Las figuras que van barradas (corcheas, semicorcheas, tresillos) se
//      agrupan por pulso, para que se vea dónde cae cada tiempo.
//
// Todo se cuenta en "ticks" enteros. Un tresillo de corchea dura 1/3 de pulso,
// así que con decimales se acumularía error a lo largo de 40 compases. 24 ticks
// por negra es divisible por 2, 3, 4, 6 y 8: cubre corcheas, semicorcheas,
// tresillos y puntillos sin salirse de los enteros.

export const TPQ = 24;
export const BEATS_PER_MEASURE = 4;
export const MEASURE_TICKS = TPQ * BEATS_PER_MEASURE; // 96
const HALF_MEASURE_TICKS = MEASURE_TICKS / 2; // 48

/** Figura escrita. No es la duración: eso depende del puntillo y del tresillo. */
export type NoteValue = "w" | "h" | "q" | "8" | "16";

const BASE_TICKS: Record<NoteValue, number> = {
  w: TPQ * 4,
  h: TPQ * 2,
  q: TPQ,
  "8": TPQ / 2,
  "16": TPQ / 4,
};

/** Cuántas barras/corchetes lleva cada figura. */
const BEAMS_OF: Record<NoteValue, number> = {
  w: 0,
  h: 0,
  q: 0,
  "8": 1,
  "16": 2,
};

const ticksOf = (value: NoteValue, dots: number) =>
  dots === 1 ? (BASE_TICKS[value] * 3) / 2 : BASE_TICKS[value];

// ---------------------------------------------------------------------------
// Vocabulario: células de 1 o 2 pulsos
// ---------------------------------------------------------------------------
//
// En vez de tirar una moneda figura a figura (que es lo que hacía antes y por
// eso salían cosas impublicables), el compás se monta con células cerradas que
// ocupan un pulso entero o dos. Así la alineación con el pulso es correcta por
// construcción y no hay que arreglarla después.

interface RhythmEvent {
  value: NoteValue;
  dots: number;
  rest: boolean;
  ticks: number;
}

const n = (value: NoteValue, dots = 0): RhythmEvent => ({
  value,
  dots,
  rest: false,
  ticks: ticksOf(value, dots),
});

const r = (value: NoteValue, dots = 0): RhythmEvent => ({
  ...n(value, dots),
  rest: true,
});

/** Nota de tresillo: tres en el espacio de dos. */
const t = (value: NoteValue): RhythmEvent => ({
  value,
  dots: 0,
  rest: false,
  ticks: (BASE_TICKS[value] * 2) / 3,
});

interface Cell {
  id: string;
  beats: 1 | 2;
  events: RhythmEvent[];
  /** Índices (dentro de events) que van unidos por barra. */
  beams: number[][];
  /** Índices que forman un tresillo. */
  tuplets: number[][];
  /** Peso relativo al sortear. Los silencios pesan menos que las notas. */
  weight: number;
}

const cell = (
  id: string,
  beats: 1 | 2,
  events: RhythmEvent[],
  weight: number,
  beams: number[][] = [],
  tuplets: number[][] = [],
): Cell => {
  const total = events.reduce((acc, ev) => acc + ev.ticks, 0);
  if (total !== beats * TPQ) {
    throw new Error(`Célula "${id}": suma ${total} ticks, esperaba ${beats * TPQ}`);
  }
  return { id, beats, events, beams, tuplets, weight };
};

const CELLS: Cell[] = [
  // — Pulso —
  cell("negra", 1, [n("q")], 6),
  cell("negra-sil", 1, [r("q")], 2),
  cell("blanca", 2, [n("h")], 3),
  cell("blanca-sil", 2, [r("h")], 1),

  // — Corcheas —
  cell("dos-corcheas", 1, [n("8"), n("8")], 5, [[0, 1]]),
  cell("corchea-sil", 1, [n("8"), r("8")], 2),
  cell("sil-corchea", 1, [r("8"), n("8")], 2),

  // — Puntillo y síncopa (2 pulsos: sólo caben en 1-2 o en 3-4) —
  cell("negra-puntillo", 2, [n("q", 1), n("8")], 3),
  cell("sincopa", 2, [n("8"), n("q"), n("8")], 3),

  // — Semicorcheas —
  cell("cuatro-semis", 1, [n("16"), n("16"), n("16"), n("16")], 3, [[0, 1, 2, 3]]),
  cell("corchea-dos-semis", 1, [n("8"), n("16"), n("16")], 3, [[0, 1, 2]]),
  cell("dos-semis-corchea", 1, [n("16"), n("16"), n("8")], 3, [[0, 1, 2]]),
  cell("semi-corchea-semi", 1, [n("16"), n("8"), n("16")], 2, [[0, 1, 2]]),
  cell("corchea-puntillo-semi", 1, [n("8", 1), n("16")], 2, [[0, 1]]),

  // — Tresillos —
  cell("tresillo", 1, [t("8"), t("8"), t("8")], 5, [[0, 1, 2]], [[0, 1, 2]]),
];

const CELL_BY_ID = new Map(CELLS.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Niveles
// ---------------------------------------------------------------------------

export interface RhythmLevel {
  slug: string;
  title: string;
  desc: string;
  badge: string;
  /** Qué figuras entran. Cada nivel arrastra las del anterior. */
  cells: string[];
  defaultBpm: number;
  measureOptions: number[];
}

const PULSO = ["negra", "negra-sil", "blanca", "blanca-sil"];
const CORCHEAS = [...PULSO, "dos-corcheas", "corchea-sil", "sil-corchea"];
const PUNTILLO = [...CORCHEAS, "negra-puntillo", "sincopa"];
const SEMIS = [
  ...PUNTILLO,
  "cuatro-semis",
  "corchea-dos-semis",
  "dos-semis-corchea",
  "semi-corchea-semi",
  "corchea-puntillo-semi",
];

export const RHYTHM_LEVELS: RhythmLevel[] = [
  {
    slug: "modulo1",
    title: "Módulo 1",
    desc: "Negras y blancas. Sólo el pulso, para cogerle el sitio al metrónomo.",
    badge: "Inicial",
    cells: PULSO,
    defaultBpm: 90,
    measureOptions: [4, 8, 12, 24],
  },
  {
    slug: "modulo2",
    title: "Módulo 2",
    desc: "Entran las corcheas: dos por pulso, unidas por barra.",
    badge: "Fácil",
    cells: CORCHEAS,
    defaultBpm: 90,
    measureOptions: [4, 8, 12, 24, 36, 42],
  },
  {
    slug: "modulo3",
    title: "Módulo 3",
    desc: "Negra con puntillo y síncopa: notas que empiezan fuera del tiempo.",
    badge: "Medio",
    cells: PUNTILLO,
    defaultBpm: 95,
    measureOptions: [4, 8, 12, 24, 36],
  },
  {
    slug: "modulo4",
    title: "Módulo 4",
    desc: "Semicorcheas: cuatro por pulso, y sus mezclas con corcheas.",
    badge: "Difícil",
    cells: SEMIS,
    defaultBpm: 70,
    measureOptions: [4, 8, 12, 24, 36],
  },
  {
    slug: "modulo5",
    title: "Módulo 5",
    desc: "Tresillos de corchea: tres notas donde antes iban dos.",
    badge: "Tresillos",
    cells: [...CORCHEAS, "tresillo"],
    defaultBpm: 80,
    measureOptions: [4, 8, 12, 24, 36],
  },
  {
    slug: "modulo6",
    title: "Módulo 6",
    desc: "Todo mezclado: tresillos contra semicorcheas, puntillos y síncopas.",
    badge: "Todo",
    cells: [...SEMIS, "tresillo"],
    defaultBpm: 70,
    measureOptions: [4, 8, 12, 24, 36, 42],
  },
];

export const findRhythmLevel = (slug: string) =>
  RHYTHM_LEVELS.find((level) => level.slug === slug);

// ---------------------------------------------------------------------------
// Generación
// ---------------------------------------------------------------------------

export interface ScoreItem {
  kind: "barline" | "note" | "rest";
  value: NoteValue;
  dots: number;
  /** Duración exacta en ticks. Las barras de compás valen 0. */
  ticks: number;
  /** La misma duración en pulsos. Sólo se usa para repartir el ancho. */
  beats: number;
  /** Barras/corchetes de la figura. */
  beams: number;
  /** Id del grupo barrado, o -1 si va suelta (se dibuja con corchete). */
  beamGroup: number;
  /** Id del tresillo al que pertenece, o -1. */
  tupletGroup: number;
  /** Sólo en barras de compás: true en la última. */
  final: boolean;
  /** Posición horizontal, la rellena el renderer. */
  xi: number;
  /** 0 acertada, 1 fallada, 2 pendiente. */
  status: number;
}

interface Slot {
  ev: RhythmEvent;
  beamGroup: number;
  tupletGroup: number;
}

const pickWeighted = (options: Cell[]): Cell => {
  const total = options.reduce((acc, c) => acc + c.weight, 0);
  let dice = Math.random() * total;
  for (const option of options) {
    dice -= option.weight;
    if (dice <= 0) return option;
  }
  return options[options.length - 1];
};

/** Monta un compás encadenando células. Todavía sin agrupar silencios. */
const buildMeasure = (cells: Cell[], seed: { beam: number; tuplet: number }) => {
  const slots: Slot[] = [];
  let pos = 0;

  while (pos < MEASURE_TICKS) {
    const beatsLeft = (MEASURE_TICKS - pos) / TPQ;
    // Una célula de 2 pulsos sólo puede empezar en el tiempo 1 o en el 3.
    // Si empezara en el 2 taparía el 3er tiempo, que es justo lo que no puede
    // pasar.
    const twoBeatAllowed = pos === 0 || pos === HALF_MEASURE_TICKS;
    const options = cells.filter(
      (c) => c.beats <= beatsLeft && (c.beats === 1 || twoBeatAllowed),
    );
    if (options.length === 0) {
      throw new Error("El nivel no tiene ninguna célula de un pulso");
    }

    const chosen = pickWeighted(options);
    const beamIds = chosen.beams.map(() => seed.beam++);
    const tupletIds = chosen.tuplets.map(() => seed.tuplet++);

    chosen.events.forEach((ev, i) => {
      const b = chosen.beams.findIndex((group) => group.includes(i));
      const tu = chosen.tuplets.findIndex((group) => group.includes(i));
      slots.push({
        ev,
        beamGroup: b < 0 ? -1 : beamIds[b],
        tupletGroup: tu < 0 ? -1 : tupletIds[tu],
      });
    });

    pos += chosen.beats * TPQ;
  }

  return slots;
};

/**
 * Escribe una racha de silencio con el valor más largo que la notación permite
 * en esa posición:
 *
 *   - redonda -> sólo el compás entero
 *   - blanca  -> sólo empezando en el tiempo 1 o en el 3 (nunca cruza el 2-3)
 *   - negra   -> sólo empezando en un tiempo entero
 *   - corchea -> sólo empezando en medio tiempo
 *   - semicorchea -> el resto
 */
const emitRests = (start: number, total: number, out: Slot[]) => {
  if (start === 0 && total === MEASURE_TICKS) {
    out.push({ ev: r("w"), beamGroup: -1, tupletGroup: -1 });
    return;
  }

  let pos = start;
  let left = total;

  while (left > 0) {
    let value: NoteValue;
    if (
      left >= HALF_MEASURE_TICKS &&
      (pos === 0 || pos === HALF_MEASURE_TICKS)
    ) {
      value = "h";
    } else if (left >= TPQ && pos % TPQ === 0) {
      value = "q";
    } else if (left >= TPQ / 2 && pos % (TPQ / 2) === 0) {
      value = "8";
    } else {
      value = "16";
    }

    const ticks = BASE_TICKS[value];
    out.push({ ev: r(value), beamGroup: -1, tupletGroup: -1 });
    pos += ticks;
    left -= ticks;
  }
};

/** Agrupa los silencios contiguos. Los tresillos nunca llevan silencio, así que
 *  una racha de silencio jamás parte un tresillo por la mitad. */
const groupRests = (slots: Slot[]): Slot[] => {
  const out: Slot[] = [];
  let pos = 0;
  let i = 0;

  while (i < slots.length) {
    if (!slots[i].ev.rest) {
      out.push(slots[i]);
      pos += slots[i].ev.ticks;
      i++;
      continue;
    }

    const start = pos;
    let total = 0;
    while (i < slots.length && slots[i].ev.rest) {
      total += slots[i].ev.ticks;
      pos += slots[i].ev.ticks;
      i++;
    }
    emitRests(start, total, out);
  }

  return out;
};

/** Un compás vale si tiene algo que tocar. Uno entero de silencio, o con una
 *  sola nota, es un compás muerto dentro de un ejercicio. */
const isPlayable = (slots: Slot[]) =>
  slots.filter((s) => !s.ev.rest).length >= 2;

const signature = (slots: Slot[]) =>
  slots.map((s) => `${s.ev.rest ? "r" : "n"}${s.ev.value}${s.ev.dots}`).join(" ");

const toItem = (slot: Slot): ScoreItem => ({
  kind: slot.ev.rest ? "rest" : "note",
  value: slot.ev.value,
  dots: slot.ev.dots,
  ticks: slot.ev.ticks,
  beats: slot.ev.ticks / TPQ,
  beams: BEAMS_OF[slot.ev.value],
  beamGroup: slot.beamGroup,
  tupletGroup: slot.tupletGroup,
  final: false,
  xi: 0,
  status: 2,
});

const barline = (final = false): ScoreItem => ({
  kind: "barline",
  value: "q",
  dots: 0,
  ticks: 0,
  beats: 0,
  beams: 0,
  beamGroup: -1,
  tupletGroup: -1,
  final,
  xi: 0,
  status: 2,
});

export interface CreateScoreOptions {
  /** Compás de entrada en silencio para que dé tiempo a coger el pulso. */
  countIn?: boolean;
}

export const createRhythmScore = (
  level: RhythmLevel,
  measures: number,
  { countIn = true }: CreateScoreOptions = {},
): ScoreItem[] => {
  const cells = level.cells
    .map((id) => CELL_BY_ID.get(id))
    .filter((c): c is Cell => Boolean(c));

  const score: ScoreItem[] = [];
  const seed = { beam: 0, tuplet: 0 };

  if (countIn) {
    score.push(barline());
    for (let i = 0; i < BEATS_PER_MEASURE; i++) {
      score.push(toItem({ ev: r("q"), beamGroup: -1, tupletGroup: -1 }));
    }
  }

  let previous = "";

  for (let m = 0; m < measures; m++) {
    score.push(barline());

    let slots = groupRests(buildMeasure(cells, seed));
    // Repetir un compás idéntico al anterior se nota mucho y aburre, y un
    // compás sin apenas notas no entrena nada. Se vuelve a tirar.
    for (let tries = 0; tries < 40; tries++) {
      if (isPlayable(slots) && signature(slots) !== previous) break;
      slots = groupRests(buildMeasure(cells, seed));
    }
    previous = signature(slots);

    slots.forEach((slot) => score.push(toItem(slot)));
  }

  score.push(barline(true));
  return score;
};
