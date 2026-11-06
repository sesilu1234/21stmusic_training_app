"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioContext, outputNode } from "@/lib/audioContext";
import { playPluckedString, type PluckParams } from "@/lib/pluckedString";
import { GRAND_PIANO, NYLON_GUITAR, fadeOut, type Sampler, type StopNote } from "@/lib/sampler";

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

export const PRESETS: Preset[] = [
  {
    label: "Piano",
    make(ctx, freq, when, out) {
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
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1)*(1-i/d.length);
      const ns = ctx.createBufferSource(); const ng = ctx.createGain();
      ns.buffer = buf;
      ng.gain.setValueAtTime(0, when);
      ng.gain.linearRampToValueAtTime(0.06, when + 0.006);
      ng.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
      ns.connect(ng); ng.connect(master); ns.start(when);
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
    label: "Synth",
    make(ctx, freq, when, out) {
      const master = ctx.createGain(); master.connect(out);
      master.gain.setValueAtTime(0, when); master.gain.linearRampToValueAtTime(0.45, when + 0.02);
      master.gain.setValueAtTime(0.35, when + 0.1); master.gain.exponentialRampToValueAtTime(0.001, when + 2.0);
      [-2,2].forEach(det => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "sawtooth"; osc.frequency.setValueAtTime(freq + det, when);
        osc.frequency.linearRampToValueAtTime(freq + det + 2, when + 0.05);
        g.gain.setValueAtTime(0.22, when); osc.connect(g); g.connect(master); osc.start(when); osc.stop(when + 2.1);
      });
      const sub = ctx.createOscillator(); const sg = ctx.createGain();
      sub.type = "sine"; sub.frequency.setValueAtTime(freq/2, when); sg.gain.setValueAtTime(0.18, when);
      sub.connect(sg); sg.connect(master); sub.start(when); sub.stop(when + 2.1);
    },
  },
];

export const PRESET_ICONS = ["🎹", "🎸", "🪈", "🎛️"];

export interface EarSound {
  label: string;
  icon: string;
  /** El timbre de osciladores (índice en PRESETS): el que suena si la grabación no ha cargado. */
  preset: number;
  sampler?: Sampler;
}

/**
 * Los timbres de los modos de oído. Piano y guitarra son grabaciones de verdad
 * (lib/sampler.ts); "Eléctrico" es el piano de osciladores de siempre. Sin
 * flauta. Los juegos de piano siguen con PRESETS.
 */
/**
 * Un timbre de osciladores con la misma forma que una grabación, para poder
 * moverlo de octava igual que el piano y la guitarra.
 */
const presetVoice = (presetIdx: number, transpose: number): Sampler => ({
  prefetch: () => Promise.resolve(),
  load: () => Promise.resolve(),
  ready: () => true,
  play: (ctx, semitone, when, out) => {
    const cut = ctx.createGain();
    cut.connect(out);
    PRESETS[presetIdx].make(ctx as AudioContext, semitonesToFreq(semitone + transpose), when, cut);
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
  { label: "Eléctrico", icon: "⚡", preset: 0, sampler: presetVoice(0, EAR_OCTAVE) },
  { label: "Guitarra", icon: "🎸", preset: 1, sampler: NYLON_GUITAR },
  { label: "Synth", icon: "🎛️", preset: 3, sampler: presetVoice(3, EAR_OCTAVE) },
];

/**
 * El timbre elegido en un modo de oído. Pide ya las grabaciones del que está
 * puesto, para que al darle a escuchar no haya que esperar a la red.
 */
export function useEarSound() {
  const [soundIdx, setSoundIdx] = useState(0);
  const sound = EAR_SOUNDS[soundIdx];
  useEffect(() => {
    sound.sampler?.prefetch().catch(() => {
      // Sin red: sonará el timbre de osciladores.
    });
  }, [sound]);
  return { soundIdx, setSoundIdx, preset: sound.preset, sampler: sound.sampler };
}

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
  ) => {
    const bass = bassBoost === 1 ? null : Math.min(...semitones);
    let boosted = false;

    semitones.forEach((s) => {
      // Solo la primera de las que estan en el bajo, por si el acorde repite
      // la fundamental: si no, el realce se sumaria dos veces.
      const emphasise = s === bass && !boosted;
      if (emphasise) boosted = true;

      let out: AudioNode = outputNode(ctx);
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
  const playInterval = useCallback((semitones: number, gapMs: number, presetIdx: number, rootOffset = -1, sampler?: Sampler) => {
    const ctx = getCtx();
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
      scheduleChord(ctx, [root], presetIdx, now, rootLift, sampler, voices);
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
   */
  const playSequence = useCallback(
    (chords: number[][], gapMs: number, presetIdx: number, bassBoost = 1, sampler?: Sampler) => {
      const ctx = getCtx();
      const gap = gapMs / 1000;
      const doPlay = () => {
        const now = ctx.currentTime + (sampler ? 0.02 : 0);
        const voices: StopNote[] = [];
        track(ctx, voices, now + chords.length * gap + VOICE_SECONDS);
        chords.forEach((chord, index) =>
          scheduleChord(ctx, chord, presetIdx, now + index * gap, bassBoost, sampler, voices),
        );
      };
      whenReady(ctx, sampler, doPlay);
    },
    [],
  );

  /**
   * Una melodía con un pedal de fondo. Lo usa el modo de modos griegos: sin
   * la fundamental sonando debajo, dórico y eólico se diferencian en una nota
   * que pasa volando; con el pedal, cada modo tiene un color.
   */
  const playOverDrone = useCallback(
    (notes: number[], gapMs: number, presetIdx: number, droneSemitone: number, sampler?: Sampler) => {
      const ctx = getCtx();
      const gap = gapMs / 1000;
      const doPlay = () => {
        const now = ctx.currentTime;
        const seconds = notes.length * gap + 1.4;
        const voices: StopNote[] = [];
        track(ctx, voices, now + seconds + VOICE_SECONDS);
        const droneCut = ctx.createGain();
        droneCut.connect(outputNode(ctx));
        voices.push(() => fadeOut(ctx, droneCut.gain));
        scheduleDrone(ctx, droneSemitone, now, seconds, droneCut);
        notes.forEach((note, index) =>
          scheduleChord(ctx, [note], presetIdx, now + 0.25 + index * gap, 1, sampler, voices),
        );
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
