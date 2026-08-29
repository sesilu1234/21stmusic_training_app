"use client";
import { useCallback, useRef } from "react";
import { playPluckedString, type PluckParams } from "@/lib/pluckedString";

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

export type Preset = { label: string; make: (ctx: AudioContext, freq: number, when: number) => void };

/**
 * La guitarra no se monta con osciladores como las demás: la nota sale entera
 * de `lib/pluckedString`. Suena algo más floja que en el piano libre porque
 * aquí se apilan hasta cuatro notas de golpe en un acorde.
 */
const GUITAR: PluckParams = { sustain: 3.4, brightness: 0.62, peak: 0.45 };

export const PRESETS: Preset[] = [
  {
    label: "Piano",
    make(ctx, freq, when) {
      const master = ctx.createGain();
      master.connect(ctx.destination);
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
    make(ctx, freq, when) {
      playPluckedString(ctx, freq, GUITAR, when);
    },
  },
  {
    label: "Flauta",
    make(ctx, freq, when) {
      const master = ctx.createGain();
      master.connect(ctx.destination);
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
    make(ctx, freq, when) {
      const master = ctx.createGain(); master.connect(ctx.destination);
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

export type Dyad = { root: number; semi: number };

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  function getCtx(): AudioContext {
    // Safari viejo solo expone webkitAudioContext.
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!ctxRef.current) ctxRef.current = new Ctor();
    return ctxRef.current;
  }

  const scheduleChord = (ctx: AudioContext, semitones: number[], presetIdx: number, when: number) => {
    semitones.forEach((s) => PRESETS[presetIdx].make(ctx, semitonesToFreq(s), when));
  };

  // Melodic (gapMs > 0) or harmonic (gapMs === 0) single interval.
  const playInterval = useCallback((semitones: number, gapMs: number, presetIdx: number, rootOffset = -1) => {
    const ctx = getCtx();
    const root = rootOffset >= 0 ? rootOffset : Math.floor(Math.random() * 8);
    const gap  = gapMs / 1000;
    const doPlay = () => {
      const now = ctx.currentTime;
      scheduleChord(ctx, [root], presetIdx, now);
      scheduleChord(ctx, [root + semitones], presetIdx, now + gap);
    };
    if (ctx.state === "suspended") ctx.resume().then(doPlay);
    else doPlay();
    return root;
  }, []);

  /**
   * Toca una secuencia de acordes, uno detrás de otro. Cada acorde es una
   * lista de semitonos absolutos. Lo usa el modo de acordes al oído, que a
   * veces necesita dar antes la tónica de referencia.
   */
  const playSequence = useCallback(
    (chords: number[][], gapMs: number, presetIdx: number) => {
      const ctx = getCtx();
      const gap = gapMs / 1000;
      const doPlay = () => {
        const now = ctx.currentTime;
        chords.forEach((chord, index) =>
          scheduleChord(ctx, chord, presetIdx, now + index * gap),
        );
      };
      if (ctx.state === "suspended") ctx.resume().then(doPlay);
      else doPlay();
    },
    [],
  );

  return { playInterval, playSequence };
}
