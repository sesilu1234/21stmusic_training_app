"use client";

import { useCallback, useRef } from "react";

import { createAudioContext } from "./audioContext";
import { playPluckedString, type PluckParams } from "./pluckedString";
import { connectReverb, type ReverbParams } from "./reverb";

/**
 * Sintetizador del piano libre.
 *
 * Los cuatro presets de `app/play/oido/audio.ts` son funciones cerradas: cada
 * una monta sus osciladores a mano y no hay nada que tocar desde fuera. Aquí
 * el sonido es una lista de parámetros, así que añadir una voz nueva es añadir
 * una fila a `VOICES` — que es lo que hace falta para poder trastear.
 *
 * Solo lo usa el piano libre. Los modos de juego siguen con los presets de
 * siempre para no cambiarles el sonido a mitad de curso; lo único que
 * comparten es el motor de cuerda de `lib/pluckedString`, que usan los dos.
 */

/** Do central. El mismo cero que usa el resto de la app. */
const BASE_FREQ = 261.63;

export const semitoneToFreq = (semitone: number) =>
  BASE_FREQ * Math.pow(2, semitone / 12);

interface VoiceBase {
  id: string;
  label: string;
  /** Una línea de qué suena, para el desplegable. */
  hint: string;
  wave: OscillatorType;
  /** Armónicos: [múltiplo de la fundamental, ganancia]. */
  partials: [number, number][];
  /** Envolvente, en segundos. */
  attack: number;
  decay: number;
  /** Nivel al que cae tras el ataque, de 0 a 1. */
  sustain: number;
  /** Cuánto suena en total desde que se pulsa. Se ignora si `sustained`. */
  duration: number;
  /**
   * true = la nota se mantiene mientras se tiene pulsada la tecla, como un
   * órgano de verdad. Las demás voces suenan su `duration` y se apagan solas,
   * que es lo que hace un piano aunque sigas apretando.
   */
  sustained?: boolean;
  /** Cuánto tarda en callarse al soltar. Solo lo usan las voces `sustained`. */
  release?: number;
  /** Ganancia máxima. Baja en las voces con muchos armónicos. */
  peak: number;
  /** Dos osciladores separados estos cents: engorda el sonido. */
  detune?: number;
  /** Temblor de volumen. `depth` de 0 a 1. */
  tremolo?: { rate: number; depth: number };
  /** Temblor de afinación. `depth` en cents. */
  vibrato?: { rate: number; depth: number };
  /** Barrido de filtro paso bajo, de `from` a `to` en Hz. */
  filter?: { from: number; to: number; q: number };
  /** Manda la voz a una sala. La señal seca sigue sonando igual. */
  reverb?: ReverbParams;
}

/** La voz de siempre: armónicos sumados bajo una envolvente. */
export interface AdditiveVoice extends VoiceBase {
  engine?: "additive";
}

/**
 * Voz de cuerda pulsada. Aquí no hay armónicos ni envolvente que valgan: la
 * nota entera sale ya hecha de `pluckedString`, con su caída dentro.
 */
export interface PluckedVoice {
  id: string;
  label: string;
  hint: string;
  engine: "plucked";
  pluck: PluckParams;
}

export type Voice = AdditiveVoice | PluckedVoice;

/** Solo el órgano se queda sonando mientras tienes la tecla apretada. */
const isSustained = (voice: Voice) =>
  voice.engine !== "plucked" && Boolean(voice.sustained);

export const VOICES: Voice[] = [
  {
    id: "piano",
    label: "Piano",
    hint: "Ataque seco y cola larga",
    wave: "sine",
    partials: [
      [1, 0.5],
      [2, 0.25],
      [3, 0.12],
      [4, 0.06],
      [5, 0.03],
    ],
    attack: 0.005,
    decay: 0.45,
    sustain: 0.22,
    duration: 3.2,
    peak: 0.55,
  },
  {
    id: "guitarra",
    label: "Guitarra acústica",
    hint: "Cuerda de acero pulsada, con caja de resonancia",
    engine: "plucked",
    pluck: {
      sustain: 3.4,
      brightness: 0.62,
      peak: 0.5,
    },
  },
  {
    id: "organo",
    label: "Órgano",
    hint: "Registros de tubo y cola de iglesia",
    // Un órgano no es una onda cuadrada: es un montón de tubos, y cada tubo da
    // un seno puro. Lo que se elige son los registros — qué tubos suenan a la
    // vez — y por eso aquí los armónicos van con sus nombres de registro.
    wave: "sine",
    partials: [
      [0.5, 0.2], // 16', la octava grave que da el cuerpo
      [1, 0.4], //   8', el fundamental
      [2, 0.26], //  4', la octava
      // 2⅔', la quinta. Este es EL registro del órgano: es lo que hace que se
      // reconozca al instante y no suene a sintetizador.
      [3, 0.17],
      [4, 0.12], //  2'
      [6, 0.07],
      [8, 0.05],
    ],
    attack: 0.03,
    decay: 0.05,
    sustain: 1,
    duration: 2,
    peak: 0.26,
    sustained: true,
    // Se suelta despacio y con cola de sala. Antes cortaba en 80 ms y sonaba a
    // interruptor; un órgano está en una iglesia y la iglesia sigue sonando
    // después de levantar el dedo.
    release: 0.22,
    reverb: { seconds: 2.6, mix: 0.5 },
  },
  {
    id: "cuerdas",
    label: "Cuerdas",
    hint: "Sierra que entra despacio, con vibrato suave",
    wave: "sawtooth",
    partials: [[1, 0.34]],
    attack: 0.25,
    decay: 0.3,
    sustain: 0.8,
    duration: 2.8,
    peak: 0.34,
    detune: 8,
    vibrato: { rate: 5, depth: 12 },
  },
  {
    id: "campana",
    label: "Campana",
    hint: "Armónicos desafinados a propósito y cola eterna",
    wave: "sine",
    partials: [
      [1, 0.4],
      [2.76, 0.2],
      [5.4, 0.11],
      [8.93, 0.05],
    ],
    attack: 0.002,
    decay: 1.3,
    sustain: 0.06,
    duration: 4.2,
    peak: 0.5,
  },
  {
    id: "pluck",
    label: "Pizzicato",
    hint: "Triangular y cortísima, como un pellizco",
    wave: "triangle",
    partials: [
      [1, 0.55],
      [2, 0.16],
    ],
    attack: 0.002,
    decay: 0.13,
    sustain: 0.02,
    duration: 0.9,
    peak: 0.6,
  },
  {
    id: "tremolo",
    label: "Trémolo",
    hint: "Cuadrada temblando de volumen, bastante loco",
    wave: "square",
    partials: [
      [1, 0.35],
      [3, 0.12],
    ],
    attack: 0.02,
    decay: 0.1,
    sustain: 0.8,
    duration: 2.6,
    peak: 0.32,
    tremolo: { rate: 9, depth: 0.85 },
  },
  {
    id: "vibrato",
    label: "Vibrato loco",
    hint: "Sierra con la afinación yendo y viniendo",
    wave: "sawtooth",
    partials: [[1, 0.32]],
    attack: 0.02,
    decay: 0.1,
    sustain: 0.8,
    duration: 2.4,
    peak: 0.34,
    vibrato: { rate: 11, depth: 80 },
  },
  {
    id: "wah",
    label: "Wah",
    hint: "El filtro se abre solo al pulsar",
    wave: "sawtooth",
    partials: [
      [1, 0.4],
      [2, 0.14],
    ],
    attack: 0.01,
    decay: 0.2,
    sustain: 0.65,
    duration: 2.2,
    peak: 0.45,
    filter: { from: 320, to: 3600, q: 11 },
  },
];

export const findVoice = (id: string) =>
  VOICES.find((voice) => voice.id === id) ?? VOICES[0];

/**
 * Un LFO conectado a donde haga falta. Devuelve el nodo de salida y cómo
 * pararlo: en las voces que se mantienen no se sabe cuándo va a acabar la nota,
 * así que no se puede programar el `stop` al empezar.
 */
const makeLfo = (ctx: AudioContext, rate: number, amount: number, when: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(rate, when);
  gain.gain.setValueAtTime(amount, when);
  osc.connect(gain);
  osc.start(when);
  return { gain, osc };
};

/** Una nota sonando, con la manera de soltarla. */
interface HeldNote {
  release: () => void;
}

/**
 * Cuerda pulsada: la nota ya viene calculada entera, así que aquí solo hay que
 * pasarla por la caja y dispararla.
 */
const spawnPlucked = (
  ctx: AudioContext,
  semitone: number,
  voice: PluckedVoice,
): HeldNote => {
  playPluckedString(ctx, semitoneToFreq(semitone), voice.pluck, ctx.currentTime);

  // La cuerda trae su propia caída dentro de la muestra, así que no hay nada
  // que soltar: levantar el dedo de una guitarra no corta la nota.
  return { release: () => {} };
};

/**
 * Monta una nota entera y la arranca.
 *
 * `hold` decide de qué va la envolvente: con `false` la nota trae su final
 * programado desde el principio (piano, campana, pizzicato…) y no hay nada más
 * que hacer; con `true` se queda en el nivel de sostenido indefinidamente y no
 * se apaga hasta que alguien llama a `release`, que es como funciona un órgano.
 */
const spawn = (
  ctx: AudioContext,
  semitone: number,
  voice: Voice,
  hold: boolean,
): HeldNote => {
  if (voice.engine === "plucked") return spawnPlucked(ctx, semitone, voice);

  const now = ctx.currentTime;
  const freq = semitoneToFreq(semitone);
  const end = now + voice.duration;

  const master = ctx.createGain();
  // Nodo aparte para el trémolo: así el LFO suma sobre el volumen de la
  // envolvente en vez de pelearse con ella por el mismo parámetro.
  const tremolo = ctx.createGain();
  tremolo.gain.setValueAtTime(1, now);

  let tail: AudioNode = tremolo;
  if (voice.filter) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.setValueAtTime(voice.filter.q, now);
    filter.frequency.setValueAtTime(voice.filter.from, now);
    filter.frequency.exponentialRampToValueAtTime(
      voice.filter.to,
      now + Math.max(0.05, voice.decay + voice.attack),
    );
    // El filtro solo vuelve a cerrarse si la nota tiene final conocido.
    if (!hold) filter.frequency.exponentialRampToValueAtTime(voice.filter.from, end);
    tremolo.connect(filter);
    tail = filter;
  }

  tail.connect(master);
  master.connect(ctx.destination);
  // Se pincha detrás de la envolvente, que es lo que oye la sala.
  if (voice.reverb) connectReverb(ctx, master, voice.reverb);

  // Envolvente. Las rampas exponenciales no pueden llegar a cero.
  const floor = 0.0001;
  const sustainLevel = Math.max(voice.peak * voice.sustain, floor);
  master.gain.setValueAtTime(floor, now);
  master.gain.linearRampToValueAtTime(voice.peak, now + voice.attack);
  master.gain.exponentialRampToValueAtTime(
    sustainLevel,
    now + voice.attack + voice.decay,
  );
  if (!hold) master.gain.exponentialRampToValueAtTime(floor, end);

  const lfos: { gain: GainNode; osc: OscillatorNode }[] = [];
  if (voice.tremolo) {
    const lfo = makeLfo(ctx, voice.tremolo.rate, voice.tremolo.depth, now);
    // El LFO oscila entre ±depth y el nodo parte de 1, así que el volumen
    // va de 1-depth a 1+depth.
    lfo.gain.connect(tremolo.gain);
    lfos.push(lfo);
  }

  const vibratoLfo = voice.vibrato
    ? makeLfo(ctx, voice.vibrato.rate, voice.vibrato.depth, now)
    : null;
  if (vibratoLfo) lfos.push(vibratoLfo);

  const oscillators: OscillatorNode[] = [];

  // Cada armónico es un oscilador; con `detune`, dos por armónico.
  const offsets = voice.detune ? [-voice.detune, voice.detune] : [0];
  voice.partials.forEach(([multiple, gainValue]) => {
    offsets.forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = voice.wave;
      osc.frequency.setValueAtTime(freq * multiple, now);
      osc.detune.setValueAtTime(offset, now);
      if (vibratoLfo) vibratoLfo.gain.connect(osc.detune);
      gain.gain.setValueAtTime(gainValue / offsets.length, now);
      osc.connect(gain);
      gain.connect(tremolo);
      osc.start(now);
      oscillators.push(osc);
    });
  });

  const stopAll = (at: number) => {
    oscillators.forEach((osc) => osc.stop(at));
    lfos.forEach((lfo) => lfo.osc.stop(at));
  };

  if (!hold) {
    // Final ya programado: no hay nada que soltar.
    stopAll(end + 0.05);
    return { release: () => {} };
  }

  let released = false;
  return {
    release: () => {
      if (released) return;
      released = true;

      const at = ctx.currentTime;
      const fade = voice.release ?? 0.08;

      // Se corta lo que quedara programado y se baja desde donde esté ahora:
      // si no, soltar en mitad del ataque daría un salto de volumen.
      master.gain.cancelScheduledValues(at);
      master.gain.setValueAtTime(Math.max(master.gain.value, floor), at);
      master.gain.exponentialRampToValueAtTime(floor, at + fade);

      stopAll(at + fade + 0.05);
    },
  };
};

/**
 * El click del metrónomo: un pitido cortísimo, no una nota.
 *
 * Va aparte de `spawn` a propósito — no tiene envolvente ni armónicos, y sobre
 * todo no debe pasar por la lista de notas mantenidas: el metrónomo no se
 * suelta ni lo apaga un `releaseAll`.
 */
const tick = (ctx: AudioContext, accent: boolean) => {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(accent ? 1800 : 1200, now);

  // Muy por debajo del piano: tiene que marcar el pulso, no taparlo.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(accent ? 0.09 : 0.05, now + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
};

export function useFreeSynth() {
  const ctxRef = useRef<AudioContext | null>(null);
  /** Las notas que están sonando ahora mismo, por semitono. */
  const heldRef = useRef(new Map<number, HeldNote>());

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = createAudioContext();
    return ctxRef.current;
  };

  /** Deja de sonar la nota, si es de las que se mantienen. */
  const release = useCallback((semitone: number) => {
    const held = heldRef.current.get(semitone);
    if (!held) return;
    heldRef.current.delete(semitone);
    held.release();
  }, []);

  /**
   * Empieza una nota. En las voces que se mantienen hay que llamar después a
   * `release`; en las demás se apaga sola y `release` no hace nada.
   */
  const press = useCallback(
    (semitone: number, voice: Voice) => {
      const ctx = getCtx();

      const start = () => {
        // Volver a pulsar una tecla que ya sonaba la reengancha desde cero, que
        // es lo que hace un teclado de verdad.
        const previous = heldRef.current.get(semitone);
        if (previous) {
          heldRef.current.delete(semitone);
          previous.release();
        }

        const note = spawn(ctx, semitone, voice, isSustained(voice));
        if (isSustained(voice)) heldRef.current.set(semitone, note);
      };

      if (ctx.state === "suspended") ctx.resume().then(start);
      else start();
    },
    [],
  );

  /**
   * Toca la nota y la deja morir sola: es para oír una voz al elegirla en el
   * menú, donde no hay nada que soltar.
   *
   * Va por su cuenta, sin pasar por la lista de notas mantenidas: así una
   * demostración no se queda colgada ni la apaga un `releaseAll` de paso.
   */
  const play = useCallback((semitone: number, voice: Voice) => {
    const ctx = getCtx();
    const start = () => spawn(ctx, semitone, voice, false);

    if (ctx.state === "suspended") ctx.resume().then(start);
    else start();
  }, []);

  /** Suelta todo lo que estuviera sonando. */
  const releaseAll = useCallback(() => {
    heldRef.current.forEach((note) => note.release());
    heldRef.current.clear();
  }, []);

  /** Un golpe de metrónomo. `accent` marca el principio de cada vuelta. */
  const click = useCallback((accent = false) => {
    const ctx = getCtx();
    const start = () => tick(ctx, accent);

    if (ctx.state === "suspended") ctx.resume().then(start);
    else start();
  }, []);

  return { play, press, release, releaseAll, click };
}
