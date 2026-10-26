"use client";

// Un solo AudioContext para los exámenes y el reto, y las dos cosas que hay
// que hacer bien con él:
//
//   · Desbloquearlo dentro del clic. iOS no deja sonar nada hasta que el audio
//     arranca en respuesta a un toque del usuario, y no vale hacerlo después
//     de un `await`: para entonces el navegador ya no lo cuenta como toque.
//     Por eso "Empezar" llama a `unlockAudio()` lo primero de todo.
//   · Programar las notas con `ctx.currentTime`, no con setTimeout. El reloj
//     del audio es exacto; el de los temporizadores se retrasa en cuanto la
//     página está ocupada, y una melodía con huecos irregulares no se puede
//     dictar.
//
// El timbre es el piano de los modos de oído (app/play/oido/audio.ts), para
// que suene igual que en el juego.

import { createAudioContext, outputNode } from "@/lib/audioContext";
import { PRESETS, scheduleDrone, semitonesToFreq } from "@/app/play/oido/audio";
import type { ExamAudio } from "@/lib/exams/types";

let shared: AudioContext | null = null;

export const audioContext = () => {
  if (!shared) shared = createAudioContext();
  return shared;
};

/** Llamar lo primero dentro del clic de "Empezar". */
export const unlockAudio = () => {
  const ctx = audioContext();
  if (ctx.state === "suspended") void ctx.resume();
  // Un búfer mudo: en Safari viejo es lo que de verdad abre el audio.
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  return ctx;
};

/** Unas notas a la vez, en `when` (reloj del audio). */
export const scheduleNotes = (notes: number[], when: number, bassBoost = 1) => {
  const ctx = audioContext();
  const bass = bassBoost === 1 ? null : Math.min(...notes);
  let boosted = false;
  notes.forEach((semitone) => {
    let out: AudioNode = outputNode(ctx);
    if (semitone === bass && !boosted) {
      boosted = true;
      const lift = ctx.createGain();
      lift.gain.value = bassBoost;
      lift.connect(out);
      out = lift;
    }
    PRESETS[0].make(ctx, semitonesToFreq(semitone), when, out);
  });
};

/** Una nota ya, al pulsar una tecla o un quesito. */
export const playNow = (semitone: number) => {
  const ctx = audioContext();
  if (ctx.state === "suspended") void ctx.resume();
  scheduleNotes([semitone], ctx.currentTime + 0.01);
};

/** Lo que suena en una pregunta de examen. Devuelve cuándo acaba (reloj del audio). */
export const playExamAudio = (audio: ExamAudio) => {
  const ctx = audioContext();
  if (ctx.state === "suspended") void ctx.resume();
  const start = ctx.currentTime + 0.08;
  if (audio.drone) scheduleDrone(ctx, audio.drone.note, start, audio.drone.seconds);
  audio.events.forEach((event) => scheduleNotes(event.notes, start + event.at, audio.bassBoost ?? 1));
  return start + audio.seconds;
};

/**
 * Un golpe de percusión corto, para el metrónomo y los ritmos de Pulso. Un
 * tono que cae en seco: se oye dónde empieza, que es lo único que importa en
 * un ritmo (la duración de una blanca no se oye con un clic).
 */
export const scheduleClick = (
  when: number,
  { freq = 1000, gain = 0.9, decay = 0.06 }: { freq?: number; gain?: number; decay?: number } = {},
) => {
  const ctx = audioContext();
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, when);
  // Baja un poco de tono al sonar: suena a madera y no a pitido.
  osc.frequency.exponentialRampToValueAtTime(freq * 0.7, when + decay);
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(gain, when + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  osc.connect(env);
  env.connect(outputNode(ctx));
  osc.start(when);
  osc.stop(when + decay + 0.02);
};

/** Un segundo de ruido blanco, hecho una vez por contexto: la parte "chas" de la caja. */
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();
const noiseBuffer = (ctx: BaseAudioContext) => {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
};

/**
 * Un golpe de caja en `when`: un ruido corto filtrado (la bordonera) y un tono
 * grave que cae (el parche). Se distingue al momento del clic del metrónomo,
 * que es un tono agudo y limpio.
 */
export const scheduleSnare = (when: number, gain = 0.9) => {
  const ctx = audioContext();
  const out = outputNode(ctx);

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 1200;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 3200;
  band.Q.value = 0.7;
  const noiseEnv = ctx.createGain();
  noiseEnv.gain.setValueAtTime(0.0001, when);
  noiseEnv.gain.exponentialRampToValueAtTime(gain, when + 0.002);
  noiseEnv.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
  noise.connect(highpass).connect(band).connect(noiseEnv).connect(out);
  noise.start(when);
  noise.stop(when + 0.2);

  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(220, when);
  body.frequency.exponentialRampToValueAtTime(140, when + 0.08);
  const bodyEnv = ctx.createGain();
  bodyEnv.gain.setValueAtTime(0.0001, when);
  bodyEnv.gain.exponentialRampToValueAtTime(gain * 0.8, when + 0.002);
  bodyEnv.gain.exponentialRampToValueAtTime(0.0001, when + 0.1);
  body.connect(bodyEnv).connect(out);
  body.start(when);
  body.stop(when + 0.12);
};
