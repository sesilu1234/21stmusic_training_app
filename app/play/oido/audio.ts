"use client";
import { createElement, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createAudioContext, outputNode } from "@/lib/audioContext";
import { playPluckedString, type PluckParams } from "@/lib/pluckedString";
import { AcousticGuitarIcon } from "./AcousticGuitarIcon";
import { FATBOY_NYLON_GUITAR, FLUID_STEEL_GUITAR, GRAND_PIANO, fadeOut, type Sampler, type StopNote } from "@/lib/sampler";

export const INTERVALS = [
  { name: "Unísono", semitones: 0 },
  { name: "b2",      semitones: 1 },
  { name: "2",       semitones: 2 },
  { name: "b3",      semitones: 3 },
  { name: "3",       semitones: 4 },
  { name: "4",       semitones: 5 },
  { name: "b5",      semitones: 6 },
  { name: "5",       semitones: 7 },
  { name: "b6",      semitones: 8 },
  { name: "6",       semitones: 9 },
  { name: "b7",      semitones: 10 },
  { name: "7",       semitones: 11 },
  { name: "8va",     semitones: 12 },
];

export const BUTTON_LABELS = ["Unísono","b2","2","b3","3","4","b5","5","b6","6","b7","7","8va"];
export const BASE_FREQ = 261.63;

export function semitonesToFreq(s: number) {
  return BASE_FREQ * Math.pow(2, s / 12);
}

export type Preset = {
  label: string;
  /**
   * `out` es donde se enchufa la nota. Casi siempre es la salida de la app,
   * pero pasandola por parametro se puede colar un `GainNode` en medio y sonar
   * una nota concreta mas fuerte que sus vecinas sin tocar el timbre.
   */
  make: (ctx: AudioContext, freq: number, when: number, out: AudioNode) => void;
};

/**
 * La guitarra no se monta con osciladores como las demás: la nota sale entera
 * de `lib/pluckedString`. Suena algo más floja que en el piano libre porque
 * aquí se apilan hasta cuatro notas de golpe en un acorde.
 */
const GUITAR: PluckParams = { sustain: 3.4, brightness: 0.62, peak: 0.45 };

/**
 * El piano de osciladores. `hammer` le pone al ataque un golpe de ruido
 * (50 ms): en los juegos de piano da algo de martillo, pero suelto suena a
 * soplido, a fuelle, y en el "Eléctrico" de oído se quita.
 */
const oscPiano = (ctx: AudioContext, freq: number, when: number, out: AudioNode, hammer: boolean) => {
  const master = ctx.createGain();
  master.connect(out);
  master.gain.setValueAtTime(0, when);
  master.gain.linearRampToValueAtTime(0.55, when + 0.020);
  master.gain.setTargetAtTime(0.18, when + 0.020, 0.15);
  master.gain.exponentialRampToValueAtTime(0.001, when + 3.5);
  [1,2,3,4,5].forEach((p, i) => {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(freq * p, when);
    g.gain.setValueAtTime([0.5,0.25,0.12,0.06,0.03][i], when);
    osc.connect(g); g.connect(master); osc.start(when); osc.stop(when + 3.6);
  });
  if (!hammer) return;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1)*(1-i/d.length);
  const ns = ctx.createBufferSource(); const ng = ctx.createGain();
  ns.buffer = buf;
  ng.gain.setValueAtTime(0, when);
  ng.gain.linearRampToValueAtTime(0.06, when + 0.006);
  ng.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
  ns.connect(ng); ng.connect(master); ns.start(when);
};

export const PRESETS: Preset[] = [
  {
    label: "Piano",
    make(ctx, freq, when, out) {
      oscPiano(ctx, freq, when, out, true);
    },
  },
  {
    label: "Guitarra",
    make(ctx, freq, when, out) {
      playPluckedString(ctx, freq, GUITAR, when, out);
    },
  },
  {
    label: "Flauta",
    make(ctx, freq, when, out) {
      const master = ctx.createGain();
      master.connect(out);
      master.gain.setValueAtTime(0, when);
      master.gain.linearRampToValueAtTime(0.4, when + 0.02);
      master.gain.exponentialRampToValueAtTime(0.001, when + 2.0);
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, when);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, when);
      lfoGain.gain.setValueAtTime(0, when);
      lfoGain.gain.linearRampToValueAtTime(3, when + 0.3);
      lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
      osc.connect(master); osc.start(when); osc.stop(when + 2.1);
      lfo.start(when); lfo.stop(when + 2.1);
    },
  },
  {
    // El "Retro", elegido a oído entre siete (antes eran dos sierras
    // desafinadas con sub: demasiado agresivo y muy corto). Onda cuadrada
    // filtrada con un triángulo a la octava, tipo videojuego; dura 1,6 s.
    label: "Synth",
    make(ctx, freq, when, out) {
      const end = when + 1.6;
      const master = ctx.createGain();
      master.connect(out);
      master.gain.setValueAtTime(0, when);
      master.gain.linearRampToValueAtTime(0.3, when + 0.01);
      master.gain.setTargetAtTime(0.16, when + 0.01, 0.3);
      master.gain.exponentialRampToValueAtTime(0.001, end);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = Math.min(2600, freq * 6);
      filter.Q.value = 0.7;
      filter.connect(master);
      ([
        ["square", 1, 0.35],
        ["triangle", 2, 0.15],
      ] as const).forEach(([type, multiple, gain]) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq * multiple, when);
        g.gain.setValueAtTime(gain, when);
        osc.connect(g);
        g.connect(filter);
        osc.start(when);
        osc.stop(end + 0.05);
      });
    },
  },
];

/** Los iconos de PRESETS. La guitarra va aparte: cambia con la versión elegida. */
export const PRESET_ICONS: ReactNode[] = ["🎹", createElement(AcousticGuitarIcon), "🪈", "🎛️"];

/** El índice de la guitarra en PRESETS y en EAR_SOUNDS. */
export const GUITAR_PRESET = 1;
/** El índice del synth en PRESETS. */
const SYNTH_PRESET = 3;

/**
 * Las dos guitarras grabadas (lib/sampler.ts). Se elige una y vale para todos
 * los juegos: oído, piano y piano libre.
 */
export const GUITAR_VARIANTS: { label: string; sampler: Sampler; icon: ReactNode }[] = [
  { label: "Acero", sampler: FLUID_STEEL_GUITAR, icon: createElement(AcousticGuitarIcon, { variant: "steel" }) },
  { label: "Nylon", sampler: FATBOY_NYLON_GUITAR, icon: createElement(AcousticGuitarIcon, { variant: "nylon" }) },
];

const VARIANT_KEY = "ear-sound-variant";

/** La guitarra elegida la última vez (0 si no hay ninguna guardada). */
export const readGuitarVariant = () => {
  try {
    const saved = Number(localStorage.getItem(VARIANT_KEY));
    return Number.isInteger(saved) && saved >= 0 && saved < GUITAR_VARIANTS.length ? saved : 0;
  } catch {
    return 0;
  }
};

/** La guitarra elegida, guardada para todos los juegos. */
export function useGuitarVariant() {
  const [variantIdx, setVariantState] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVariantState(readGuitarVariant());
  }, []);
  const setVariantIdx = useCallback((index: number) => {
    setVariantState(index);
    try {
      localStorage.setItem(VARIANT_KEY, String(index));
    } catch {
      // Da igual: solo no se recuerda.
    }
  }, []);
  return { variantIdx, setVariantIdx };
}

/**
 * La misma grabación a la altura escrita. En los modos de oído todo suena una
 * octava por debajo (ver EAR_OCTAVE); los juegos de piano y el piano libre
 * suenan donde está la tecla.
 */
const atWrittenPitch = (inner: Sampler): Sampler => ({
  prefetch: inner.prefetch,
  load: inner.load,
  ready: inner.ready,
  play: (ctx, semitone, when, out) => inner.play(ctx, semitone + 12, when, out),
});

/** El synth de PRESETS como "grabación", a la altura de la tecla: para poder darle volumen. */
const WRITTEN_PITCH_SYNTH: Sampler = {
  prefetch: () => Promise.resolve(),
  load: () => Promise.resolve(),
  ready: () => true,
  play: (ctx, semitone, when, out) => {
    const cut = ctx.createGain();
    cut.connect(out);
    PRESETS[SYNTH_PRESET].make(ctx as AudioContext, semitonesToFreq(semitone), when, cut);
    return () => fadeOut(ctx, cut.gain);
  },
};

/** Las guitarras grabadas a la altura de la tecla, en el orden de GUITAR_VARIANTS. */
export const WRITTEN_PITCH_GUITARS = GUITAR_VARIANTS.map((variant) => atWrittenPitch(variant.sampler));

/**
 * Los juegos de piano solo dicen qué timbre de PRESETS quieren. Si es la
 * guitarra, suena la grabada que esté elegida, no la sintetizada.
 */
const resolveSampler = (presetIdx: number, sampler?: Sampler) => {
  if (sampler) return sampler;
  if (presetIdx === GUITAR_PRESET) {
    const variant = readGuitarVariant();
    return withGain(WRITTEN_PITCH_GUITARS[variant], PIANO_GAME_BALANCE.Guitarra[variant]);
  }
  if (presetIdx === SYNTH_PRESET) return withGain(WRITTEN_PITCH_SYNTH, PIANO_GAME_BALANCE.Synth[0]);
  return undefined;
};

/** Los sonidos de los juegos de piano, para el selector de la cabecera. */
export const PIANO_GAME_SOUNDS = PRESETS.map((preset, index) => ({
  label: preset.label,
  icon: PRESET_ICONS[index],
  variants: index === GUITAR_PRESET ? GUITAR_VARIANTS : undefined,
}));

/**
 * El mismo instrumento con el volumen retocado (1 = igual). Para igualar los
 * timbres entre sí sin tocar las grabaciones, que comparten todos los juegos.
 */
const gainCache = new Map<string, Sampler>();
const gainIds = new Map<Sampler, number>();
export const withGain = (inner: Sampler, factor: number): Sampler => {
  if (factor === 1) return inner;
  if (!gainIds.has(inner)) gainIds.set(inner, gainIds.size);
  const key = `${gainIds.get(inner)}:${factor}`;
  const cached = gainCache.get(key);
  if (cached) return cached;
  const wrapped: Sampler = {
    prefetch: inner.prefetch,
    load: inner.load,
    ready: inner.ready,
    play: (ctx, semitone, when, out) => {
      const trim = ctx.createGain();
      trim.gain.value = factor;
      trim.connect(out);
      const stop = inner.play(ctx, semitone, when, trim);
      if (!stop) trim.disconnect();
      // Lo más largo que suena es el piano (6,5 s): pasado eso, se suelta.
      else window.setTimeout(() => trim.disconnect(), (when - ctx.currentTime + 9) * 1000);
      return stop;
    },
  };
  gainCache.set(key, wrapped);
  return wrapped;
};

/**
 * PRUEBA (de momento solo en intervalos melódicos): la guitarra con una caída
 * suave y continua desde el ataque, como una cuerda de verdad. Grabada tal
 * cual se queda casi a volumen fijo y el corte de los 3 s se oye de golpe:
 * suena a sintetizador. Con esto, para cuando llega ese corte la nota ya va
 * por -20/-30 dB y se apaga sola.
 *
 * `seconds`: la constante de la caída. En ese tiempo baja a un 37 %
 * (-9 dB), en el doble a un 14 % (-17 dB)…
 */
const softDecayCache = new Map<string, Sampler>();
const softDecayIds = new Map<Sampler, number>();
export const withSoftDecay = (inner: Sampler, seconds: number): Sampler => {
  if (!softDecayIds.has(inner)) softDecayIds.set(inner, softDecayIds.size);
  const key = `${softDecayIds.get(inner)}:${seconds}`;
  const cached = softDecayCache.get(key);
  if (cached) return cached;
  const wrapped: Sampler = {
    prefetch: inner.prefetch,
    load: inner.load,
    ready: inner.ready,
    play: (ctx, semitone, when, out) => {
      const envelope = ctx.createGain();
      envelope.connect(out);
      // El ataque entero, y desde ahí bajando sin parar.
      envelope.gain.setValueAtTime(1, when);
      envelope.gain.setTargetAtTime(0, when + 0.06, seconds);
      const stop = inner.play(ctx, semitone, when, envelope);
      if (!stop) envelope.disconnect();
      // La nota dura 3 s: pasado eso, se suelta el nodo.
      else window.setTimeout(() => envelope.disconnect(), (when - ctx.currentTime + 4) * 1000);
      return stop;
    },
  };
  softDecayCache.set(key, wrapped);
  return wrapped;
};

/**
 * La constante de la caída de cada guitarra, en el orden de GUITAR_VARIANTS.
 * La de acero aguanta mucho más en la grabación: necesita caer antes.
 */
export const GUITAR_SOFT_DECAY = [0.8, 1.05];

const SOUND_KEY = "sound-choice";

/**
 * Instrumentos que no están en todas las listas, y cuál poner en su lugar.
 * Los juegos de oído tienen Piano (de cola), Eléctrico, Guitarra y Synth; los
 * de piano, Piano (de osciladores), Guitarra, Flauta y Synth. El "Piano" de
 * los de piano suena como el Eléctrico de oído.
 */
const SOUND_STAND_IN: Record<string, string> = {
  "Eléctrico": "Piano",
  Flauta: "Piano",
};

/**
 * El instrumento elegido, recordado entre juegos. Se guarda el NOMBRE, no la
 * posición: las listas de oído y de piano no son iguales, y la tercera de
 * una (Guitarra) es la Flauta de la otra. Si el guardado no está en esta
 * lista, va el que lo sustituye; si tampoco, el primero (el piano).
 */
function useRememberedSound(labels: string[]) {
  const [index, setIndex] = useState(0);
  const key = labels.join("|");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      if (!saved) return;
      const names = key.split("|");
      let found = names.indexOf(saved);
      if (found < 0 && SOUND_STAND_IN[saved]) found = names.indexOf(SOUND_STAND_IN[saved]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found > 0) setIndex(found);
    } catch {
      // Sin almacenamiento: el piano.
    }
  }, [key]);
  const choose = useCallback(
    (next: number) => {
      setIndex(next);
      try {
        localStorage.setItem(SOUND_KEY, key.split("|")[next]);
      } catch {
        // Solo no se recuerda.
      }
    },
    [key],
  );
  return [index, choose] as const;
}

/** El timbre de un juego de piano, con la guitarra elegida ya pedida a la red. */
export function usePianoGameSound() {
  const [presetIdx, setPresetIdx] = useRememberedSound(PRESETS.map((preset) => preset.label));
  const { variantIdx, setVariantIdx } = useGuitarVariant();
  useEffect(() => {
    if (presetIdx !== GUITAR_PRESET) return;
    GUITAR_VARIANTS[variantIdx].sampler.prefetch().catch(() => {
      // Sin red: sonará la guitarra sintetizada.
    });
  }, [presetIdx, variantIdx]);
  return { presetIdx, setPresetIdx, variantIdx, setVariantIdx };
}

export interface EarSound {
  label: string;
  icon: ReactNode;
  /** El timbre de osciladores (índice en PRESETS): el que suena si la grabación no ha cargado. */
  preset: number;
  sampler?: Sampler;
  /** Versiones a elegir del mismo instrumento (la guitarra: acero o nylon). */
  variants?: { label: string; sampler: Sampler; icon: ReactNode }[];
}

/** El icono de un sonido con la versión elegida (la guitarra cambia de color). */
export const earSoundIcon = (sound: EarSound, variantIdx: number) =>
  sound.variants?.[variantIdx]?.icon ?? sound.icon;

/**
 * Los timbres de los modos de oído. Piano y guitarra son grabaciones de verdad
 * (lib/sampler.ts); "Eléctrico" es el piano de osciladores de siempre. Sin
 * flauta. Los juegos de piano siguen con PRESETS.
 */
/**
 * Un timbre de osciladores con la misma forma que una grabación, para poder
 * moverlo de octava igual que el piano y la guitarra.
 */
const presetVoice = (make: Preset["make"], transpose: number): Sampler => ({
  prefetch: () => Promise.resolve(),
  load: () => Promise.resolve(),
  ready: () => true,
  play: (ctx, semitone, when, out) => {
    const cut = ctx.createGain();
    cut.connect(out);
    make(ctx as AudioContext, semitonesToFreq(semitone + transpose), when, cut);
    return () => fadeOut(ctx, cut.gain);
  },
});

/**
 * Todos una octava por debajo de lo escrito, a la par que el piano grabado
 * (lib/sampler.ts): al cambiar de sonido tiene que sonar exactamente la misma
 * pregunta, a la misma altura. Antes Eléctrico y Synth iban una octava por
 * encima de los otros dos.
 */
const EAR_OCTAVE = -12;

export const EAR_SOUNDS: EarSound[] = [
  { label: "Piano", icon: "🎹", preset: 0, sampler: GRAND_PIANO },
  { label: "Eléctrico", icon: "⚡", preset: 0, sampler: presetVoice((ctx, freq, when, out) => oscPiano(ctx, freq, when, out, false), EAR_OCTAVE) },
  {
    label: "Guitarra",
    icon: createElement(AcousticGuitarIcon, { variant: "steel" }),
    preset: 1,
    sampler: FLUID_STEEL_GUITAR,
    variants: GUITAR_VARIANTS,
  },
  { label: "Synth", icon: "🎛️", preset: 3, sampler: presetVoice(PRESETS[3].make, EAR_OCTAVE) },
];

/**
 * El timbre elegido en un modo de oído. Pide ya las grabaciones del que está
 * puesto, para que al darle a escuchar no haya que esperar a la red.
 */
export function useEarSound(modeLevel: number = EAR_MODE_LEVEL.oneNote) {
  const [soundIdx, setSoundIdx] = useRememberedSound(EAR_SOUNDS.map((sound) => sound.label));
  // La versión elegida (acero o nylon) se recuerda entre juegos.
  const { variantIdx, setVariantIdx } = useGuitarVariant();
  const sound = EAR_SOUNDS[soundIdx];
  const raw = sound.variants?.[variantIdx]?.sampler ?? sound.sampler;
  useEffect(() => {
    raw?.prefetch().catch(() => {
      // Sin red: sonará el timbre de osciladores.
    });
  }, [raw]);
  // El equilibrio entre instrumentos y el volumen del modo. `withGain` guarda
  // cada combinación: el mismo objeto en cada render.
  const balance = EAR_BALANCE[sound.label]?.[sound.variants ? variantIdx : 0] ?? 1;
  const sampler = raw && withGain(raw, balance * modeLevel);
  return { soundIdx, setSoundIdx, variantIdx, setVariantIdx, preset: sound.preset, sampler };
}

/**
 * El volumen de cada instrumento de oído respecto a los demás (1 = como
 * viene), por nombre; la guitarra, por versión (acero, nylon). Ajustado a oído
 * en armónico y de ahí llevado a todos los modos.
 */
export const EAR_BALANCE: Record<string, number[]> = {
  Piano: [0.56],
  "Eléctrico": [0.7],
  Guitarra: [0.56, 1.35],
  Synth: [1.35],
};

/**
 * El volumen general de cada modo de oído, según cuántas notas suenan a la
 * vez. Armónico es la referencia (ajustado a oído): dos notas, y además
 * reforzadas (HARMONIC_BALANCE), así que va bastante bajo. Con acordes
 * (3–4 notas) se baja para quedar parecido; con una nota cada vez se deja
 * como estaba.
 */
export const EAR_MODE_LEVEL = {
  harmonic: 0.63 * 0.75,
  chords: 0.75,
  oneNote: 1,
} as const;

/**
 * El mismo equilibrio para los juegos de piano. Su "Piano" es el de
 * osciladores, como el "Eléctrico" de oído: se toma de referencia (1).
 */
const PIANO_GAME_BALANCE = {
  Guitarra: EAR_BALANCE.Guitarra.map((value) => value / EAR_BALANCE["Eléctrico"][0]),
  Synth: EAR_BALANCE.Synth.map((value) => value / EAR_BALANCE["Eléctrico"][0]),
};

/**
 * Arranca el audio y, si hace falta, espera a la grabación antes de tocar.
 * El resume va lo primero y dentro del clic: iOS no lo deja hacer después de
 * esperar a nada. Si la grabación no carga, se toca igual (con osciladores).
 */
const whenReady = (ctx: AudioContext, sampler: Sampler | undefined, play: () => void) => {
  const resumed = ctx.state === "suspended" ? ctx.resume() : null;
  const loading = sampler && !sampler.ready() ? sampler.load(ctx).catch(() => undefined) : null;
  if (resumed || loading) void Promise.all([resumed, loading]).then(play);
  else play();
};

export type Dyad = { root: number; semi: number };

/**
 * El balance del intervalo armónico: cuánto suena cada nota respecto a una
 * nota normal (1). La grave va bastante por delante (≈ +7 dB): con dos notas a
 * la vez el oído se va solo a la de arriba (la oye como melodía) y acaba
 * tomándola por la fundamental. La aguda, algo por encima (≈ +4 dB), para
 * que no se pierda del todo debajo de la grave.
 */
const HARMONIC_BALANCE = { low: 2.25, high: 1.6 } as const;

/** Lo que tarda en apagarse un acorde o nota al entrar el siguiente (`damp`). */
const DAMP_SECONDS = 0.25;

/**
 * Un volumen que deja pasar el sonido hasta `at` y desde ahí lo apaga con un
 * fundido corto: lo que hace `damp`, como un pianista que levanta los dedos.
 */
const dampAt = (ctx: AudioContext, at: number) => {
  const gain = ctx.createGain();
  gain.connect(outputNode(ctx));
  gain.gain.setValueAtTime(1, at);
  gain.gain.setTargetAtTime(0, at, DAMP_SECONDS / 3);
  return gain;
};

/** Lo que tarda en entrar la melodía detrás del pedal, en `playOverDrone`. */
const MELODY_LEAD = 0.25;

/** Lo más que puede durar una nota, cola incluida (el piano grabado, 6,5 s). */
const VOICE_SECONDS = 8;

/**
 * Nota tenida: entra, se queda y se va. Los PRESETS no valen para esto
 * porque todos decaen en un par de segundos, y un pedal tiene que aguantar
 * la escala entera por debajo.
 */
export const scheduleDrone = (
  ctx: AudioContext,
  semitone: number,
  when: number,
  seconds: number,
  out: AudioNode = outputNode(ctx),
) => {
  const master = ctx.createGain();
  master.connect(out);
  master.gain.setValueAtTime(0, when);
  master.gain.linearRampToValueAtTime(0.17, when + 0.35);
  master.gain.setValueAtTime(0.17, when + seconds - 0.5);
  master.gain.exponentialRampToValueAtTime(0.001, when + seconds);

  const freq = semitonesToFreq(semitone);
  // Fundamental gorda y dos armónicos flojos: suficiente para que se oiga
  // debajo sin taparle el sitio a la escala.
  ([
    [1, 0.5],
    [2, 0.16],
    [3, 0.06],
  ] as const).forEach(([multiple, gain]) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * multiple, when);
    g.gain.setValueAtTime(gain, when);
    osc.connect(g);
    g.connect(master);
    osc.start(when);
    osc.stop(when + seconds + 0.1);
  });
};

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  function getCtx(): AudioContext {
    if (!ctxRef.current) ctxRef.current = createAudioContext();
    return ctxRef.current;
  }

  /**
   * Lo que está sonando, para poder cortarlo. Con el sustain del piano, si se
   * vuelve a escuchar (o llega la siguiente pregunta) antes de que se apague,
   * lo nuevo se pisaba con lo anterior. Cada tanda lleva hasta cuándo puede
   * sonar: pasado eso se olvida, para que la lista no crezca en los juegos de
   * piano, que tocan mucho y no cortan nunca.
   */
  const voicesRef = useRef<{ stops: StopNote[]; until: number }[]>([]);
  const track = (ctx: AudioContext, stops: StopNote[], until: number) => {
    voicesRef.current = voicesRef.current.filter((batch) => batch.until > ctx.currentTime);
    voicesRef.current.push({ stops, until });
  };
  /** Corta todo lo que esté sonando. */
  const silence = useCallback(() => {
    voicesRef.current.forEach((batch) => batch.stops.forEach((stop) => stop()));
    voicesRef.current = [];
  }, []);

  /**
   * `bassBoost` sube solo la nota mas grave del acorde. Va aparte del volumen
   * general a proposito: en los modos donde hay que sacar de oido la distancia
   * entre dos acordes, la referencia es el bajo, y apilado con las otras tres o
   * cuatro notas se pierde. Subiendolo un poco el acorde suena igual pero el
   * bajo se distingue, que es lo que hay que oir.
   */
  const scheduleChord = (
    ctx: AudioContext,
    semitones: number[],
    presetIdx: number,
    when: number,
    bassBoost = 1,
    sampler?: Sampler,
    voices?: StopNote[],
    /** Dónde enchufar el acorde (por defecto, la salida de la app). */
    dest?: AudioNode,
  ) => {
    const bass = bassBoost === 1 ? null : Math.min(...semitones);
    let boosted = false;

    semitones.forEach((s) => {
      // Solo la primera de las que estan en el bajo, por si el acorde repite
      // la fundamental: si no, el realce se sumaria dos veces.
      const emphasise = s === bass && !boosted;
      if (emphasise) boosted = true;

      let out: AudioNode = dest ?? outputNode(ctx);
      if (emphasise) {
        const lift = ctx.createGain();
        lift.gain.value = bassBoost;
        lift.connect(out);
        out = lift;
      }

      // El instrumento grabado, si se ha pedido y ya está cargado; si no, el de osciladores.
      const stop = sampler?.play(ctx, s, when, out);
      if (stop) {
        voices?.push(stop);
        return;
      }
      if (!voices) {
        PRESETS[presetIdx].make(ctx, semitonesToFreq(s), when, out);
        return;
      }
      // Los de osciladores no tienen reverb: basta con un volumen delante
      // para poder apagarlos.
      const cut = ctx.createGain();
      cut.connect(out);
      PRESETS[presetIdx].make(ctx, semitonesToFreq(s), when, cut);
      voices.push(() => fadeOut(ctx, cut.gain));
    });
  };

  /**
   * Un intervalo melódico (gapMs > 0) o armónico (gapMs === 0).
   *
   * `sampler`: un instrumento grabado (lib/sampler.ts) en vez del timbre de
   * osciladores. De momento solo lo usa intervalos melódicos, para probarlo.
   * La primera vez espera a que esté cargado; si no carga, suena `presetIdx`.
   */
  const playInterval = useCallback((semitones: number, gapMs: number, presetIdx: number, rootOffset = -1, chosen?: Sampler, damp = false) => {
    const ctx = getCtx();
    const sampler = resolveSampler(presetIdx, chosen);
    const root = rootOffset >= 0 ? rootOffset : Math.floor(Math.random() * 8);
    const gap  = gapMs / 1000;
    const doPlay = () => {
      // Lo anterior se corta antes de que entre lo nuevo.
      silence();
      const voices: StopNote[] = [];
      // Un pelín de margen: si se acaba de cargar, que no se coma el ataque.
      const now = ctx.currentTime + 0.02;
      track(ctx, voices, now + gap + VOICE_SECONDS);
      const harmonic = gap === 0;
      const rootLift = harmonic ? HARMONIC_BALANCE.low : 1;
      // `damp` (solo melódico): la primera se apaga al entrar la segunda, para
      // que no se quede debajo y el intervalo no suene casi armónico.
      const rootDest = damp && !harmonic ? dampAt(ctx, now + gap) : undefined;
      scheduleChord(ctx, [root], presetIdx, now, rootLift, sampler, voices, rootDest);
      // Dos notas perfectamente a la vez y perfectamente afinadas en octava el
      // oído las oye como una. En armónico la de arriba entra 25 ms tarde
      // (como al tocarlo con dos dedos, no se oye como arpegio) y 5 cents alta
      // (como la octava "abierta" de un piano afinado): eso da un batido lento
      // que delata que son dos notas. En los demás intervalos ni se nota, y va
      // igual en todos para que no sea una pista.
      const upperStart = harmonic ? 0.025 : gap;
      const upperNote = root + semitones + (harmonic ? 0.05 : 0);
      const upperLift = harmonic ? HARMONIC_BALANCE.high : 1;
      scheduleChord(ctx, [upperNote], presetIdx, now + upperStart, upperLift, sampler, voices);
    };
    whenReady(ctx, sampler, doPlay);
    return root;
  }, [silence]);

  /**
   * Toca una secuencia de acordes, uno detrás de otro. Cada acorde es una
   * lista de semitonos absolutos. Lo usa el modo de acordes al oído, que a
   * veces necesita dar antes la tónica de referencia.
   *
   * `onStart` se llama justo cuando empieza a sonar. La primera vez hay que
   * esperar a que cargue la grabación: lo que vaya a la par del sonido (las
   * casillas que se encienden) tiene que arrancar aquí, no al darle.
   */
  const playSequence = useCallback(
    (
      chords: number[][],
      gapMs: number,
      presetIdx: number,
      bassBoost = 1,
      chosen?: Sampler,
      onStart?: () => void,
      damp = false,
    ) => {
      const ctx = getCtx();
      const sampler = resolveSampler(presetIdx, chosen);
      const gap = gapMs / 1000;
      const doPlay = () => {
        onStart?.();
        const now = ctx.currentTime + (sampler ? 0.02 : 0);
        const voices: StopNote[] = [];
        track(ctx, voices, now + chords.length * gap + VOICE_SECONDS);
        chords.forEach((chord, index) => {
          const start = now + index * gap;
          let dest: AudioNode | undefined;
          // `damp`: cada acorde se apaga cuando entra el siguiente, como un
          // pianista que levanta los dedos sin pedal (fundido de ~0,25 s, no un
          // corte). Sin esto se quedan sonando todos, como con el pedal pisado.
          if (damp && index < chords.length - 1) dest = dampAt(ctx, start + gap);
          scheduleChord(ctx, chord, presetIdx, start, bassBoost, sampler, voices, dest);
        });
      };
      whenReady(ctx, sampler, doPlay);
    },
    [],
  );

  /**
   * Una melodía con un pedal de fondo. Lo usa el modo de modos griegos: sin
   * la fundamental sonando debajo, dórico y eólico se diferencian en una nota
   * que pasa volando; con el pedal, cada modo tiene un color.
   * `onStart`, como en `playSequence`, pero recibe los ms que faltan para que
   * se oiga la primera nota de la melodía (entra 0,25 s después del pedal, más
   * lo que tarda el audio en salir por los altavoces): lo que vaya a la par de
   * la melodía tiene que esperar eso.
   */
  const playOverDrone = useCallback(
    (
      notes: number[],
      gapMs: number,
      presetIdx: number,
      droneSemitone: number,
      chosen?: Sampler,
      onStart?: (leadMs: number) => void,
      damp = false,
    ) => {
      const ctx = getCtx();
      const sampler = resolveSampler(presetIdx, chosen);
      const gap = gapMs / 1000;
      const doPlay = () => {
        const latency = ctx.outputLatency || ctx.baseLatency || 0;
        onStart?.((MELODY_LEAD + latency) * 1000);
        const now = ctx.currentTime;
        const seconds = notes.length * gap + 1.4;
        const voices: StopNote[] = [];
        track(ctx, voices, now + seconds + VOICE_SECONDS);
        const droneCut = ctx.createGain();
        droneCut.connect(outputNode(ctx));
        voices.push(() => fadeOut(ctx, droneCut.gain));
        scheduleDrone(ctx, droneSemitone, now, seconds, droneCut);
        notes.forEach((note, index) => {
          const start = now + MELODY_LEAD + index * gap;
          // `damp`: cada nota de la escala se apaga al entrar la siguiente (el
          // pedal sigue sonando debajo).
          const dest = damp && index < notes.length - 1 ? dampAt(ctx, start + gap) : undefined;
          scheduleChord(ctx, [note], presetIdx, start, 1, sampler, voices, dest);
        });
      };
      whenReady(ctx, sampler, doPlay);
    },
    [],
  );

  /**
   * `stop` corta lo que esté sonando. Los modos de oído lo llaman al volver a
   * escuchar o al pasar de pregunta; `playInterval` ya lo hace solo. Los
   * juegos de piano no: cada tecla tiene que dejar sonar la anterior.
   */
  return { playInterval, playSequence, playOverDrone, stop: silence };
}
