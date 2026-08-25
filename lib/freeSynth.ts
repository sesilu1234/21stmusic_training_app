"use client";

import { useCallback, useRef } from "react";

/**
 * Sintetizador del piano libre.
 *
 * Los cuatro presets de `app/play/oido/audio.ts` son funciones cerradas: cada
 * una monta sus osciladores a mano y no hay nada que tocar desde fuera. Aquí
 * el sonido es una lista de parámetros, así que añadir una voz nueva es añadir
 * una fila a `VOICES` — que es lo que hace falta para poder trastear.
 *
 * Solo lo usa el piano libre. Los modos de juego siguen con los presets de
 * siempre para no cambiarles el sonido a mitad de curso.
 */

/** Do central. El mismo cero que usa el resto de la app. */
const BASE_FREQ = 261.63;

export const semitoneToFreq = (semitone: number) =>
  BASE_FREQ * Math.pow(2, semitone / 12);

export interface Voice {
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
  /** Cuánto suena en total desde que se pulsa. */
  duration: number;
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
}

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
    id: "organo",
    label: "Órgano",
    hint: "Cuadrada, sin caída: suena hasta que sueltas",
    wave: "square",
    partials: [
      [1, 0.4],
      [2, 0.2],
      [4, 0.12],
      [8, 0.05],
    ],
    attack: 0.02,
    decay: 0.06,
    sustain: 0.95,
    duration: 1.8,
    peak: 0.3,
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

/** Un LFO conectado a donde haga falta. Devuelve el nodo de salida. */
const makeLfo = (
  ctx: AudioContext,
  rate: number,
  amount: number,
  when: number,
  stopAt: number,
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(rate, when);
  gain.gain.setValueAtTime(amount, when);
  osc.connect(gain);
  osc.start(when);
  osc.stop(stopAt);
  return gain;
};

export function useFreeSynth() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    // Safari viejo solo expone webkitAudioContext.
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!ctxRef.current) ctxRef.current = new Ctor();
    return ctxRef.current;
  };

  const play = useCallback((semitone: number, voice: Voice) => {
    const ctx = getCtx();

    const strike = () => {
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
        filter.frequency.exponentialRampToValueAtTime(voice.filter.from, end);
        tremolo.connect(filter);
        tail = filter;
      }

      tail.connect(master);
      master.connect(ctx.destination);

      // Envolvente. Las rampas exponenciales no pueden llegar a cero.
      const floor = 0.0001;
      const sustainLevel = Math.max(voice.peak * voice.sustain, floor);
      master.gain.setValueAtTime(floor, now);
      master.gain.linearRampToValueAtTime(voice.peak, now + voice.attack);
      master.gain.exponentialRampToValueAtTime(
        sustainLevel,
        now + voice.attack + voice.decay,
      );
      master.gain.exponentialRampToValueAtTime(floor, end);

      if (voice.tremolo) {
        const lfo = makeLfo(ctx, voice.tremolo.rate, voice.tremolo.depth, now, end);
        // El LFO oscila entre ±depth y el nodo parte de 1, así que el volumen
        // va de 1-depth a 1+depth.
        lfo.connect(tremolo.gain);
      }

      const vibrato = voice.vibrato
        ? makeLfo(ctx, voice.vibrato.rate, voice.vibrato.depth, now, end)
        : null;

      // Cada armónico es un oscilador; con `detune`, dos por armónico.
      const offsets = voice.detune ? [-voice.detune, voice.detune] : [0];
      voice.partials.forEach(([multiple, gainValue]) => {
        offsets.forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = voice.wave;
          osc.frequency.setValueAtTime(freq * multiple, now);
          osc.detune.setValueAtTime(offset, now);
          if (vibrato) vibrato.connect(osc.detune);
          gain.gain.setValueAtTime(gainValue / offsets.length, now);
          osc.connect(gain);
          gain.connect(tremolo);
          osc.start(now);
          osc.stop(end + 0.05);
        });
      });
    };

    if (ctx.state === "suspended") ctx.resume().then(strike);
    else strike();
  }, []);

  return { play };
}
