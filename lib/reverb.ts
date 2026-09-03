"use client";

import { outputNode } from "./audioContext";

/**
 * Reverb.
 *
 * Un `ConvolverNode` necesita una respuesta al impulso: la grabación de cómo
 * suena un pistoletazo en una sala. Lo normal es cargar un fichero .wav, pero
 * aquí no hay ni uno solo de audio en todo el proyecto y no hace falta: una
 * cola de ruido que se apaga es exactamente eso, y sale muy convincente para
 * una sala grande.
 *
 * Lo que le da el color de iglesia no es la cola en sí, sino que los agudos se
 * apaguen antes que los graves — la piedra y la madera se comen el brillo
 * mucho más rápido. Eso se consigue filtrando el ruido con un paso bajo cuya
 * frecuencia baja según avanza la cola.
 */

export interface ReverbParams {
  /** Cuánto dura la cola, en segundos. */
  seconds: number;
  /** Cuánto se manda a la reverb, de 0 (seca) a 1. */
  mix: number;
}

/** Genera la respuesta al impulso: ruido que se apaga y se va oscureciendo. */
const renderImpulse = (ctx: AudioContext, seconds: number): AudioBuffer => {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const impulse = ctx.createBuffer(2, length, rate);

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    // Un paso bajo de un polo por canal. Se va cerrando con el tiempo, así que
    // el final de la cola es mucho más oscuro que el principio.
    let lowpass = 0;

    for (let i = 0; i < length; i++) {
      const progress = i / length;

      // Caída exponencial. El exponente por encima de 1 hace que la cola se
      // vaya apagando cada vez más despacio, que es como decae una sala de
      // verdad y no como una puerta que se cierra.
      const decay = (1 - progress) ** 2.6;

      // De 0.55 (bastante abierto al principio) a 0.06 (muy cerrado al final).
      const cutoff = 0.55 - 0.49 * progress;
      lowpass += cutoff * (Math.random() * 2 - 1 - lowpass);

      data[i] = lowpass * decay;
    }

    // Los primeros milisegundos son el sonido directo, no la sala: si no se
    // quitan, la reverb emborrona el ataque en vez de quedarse detrás.
    const predelay = Math.min(length, Math.floor(rate * 0.012));
    for (let i = 0; i < predelay; i++) data[i] *= i / predelay;
  }

  return impulse;
};

/**
 * Una sala por contexto y duración. Generar la cola cuesta unos milisegundos, y
 * montar un convolucionador por cada nota sería tirar el procesador: todas las
 * notas comparten la misma sala, que además es lo que hace que suenen como si
 * estuvieran en el mismo sitio.
 *
 * La caché va en un WeakMap colgado del contexto, no en un mapa suelto: un nodo
 * de audio pertenece al contexto donde nació y conectarlo a otro es un error.
 * Y sale un contexto nuevo cada vez que se monta el piano, así que guardar los
 * nodos por duración a secas reventaba al salir de la pantalla y volver.
 */
const rooms = new WeakMap<AudioContext, Map<number, GainNode>>();

export const getReverbSend = (ctx: AudioContext, seconds: number): GainNode => {
  let byLength = rooms.get(ctx);
  if (!byLength) {
    byLength = new Map<number, GainNode>();
    rooms.set(ctx, byLength);
  }

  const cached = byLength.get(seconds);
  if (cached) return cached;

  const send = ctx.createGain();
  send.gain.value = 1;

  const convolver = ctx.createConvolver();
  convolver.buffer = renderImpulse(ctx, seconds);

  // La reverb no tiene por qué traer graves: en una sala el retumbe grave
  // emborrona, y quitándolo se entiende mucho mejor lo que se toca.
  const cut = ctx.createBiquadFilter();
  cut.type = "highpass";
  cut.frequency.value = 220;

  send.connect(convolver);
  convolver.connect(cut);
  cut.connect(outputNode(ctx));

  byLength.set(seconds, send);
  return send;
};

/**
 * Conecta una voz a la sala. La señal seca sigue yendo por su lado: sin ella
 * la nota pierde el ataque y suena lejos, no espaciosa.
 */
export const connectReverb = (
  ctx: AudioContext,
  source: AudioNode,
  params: ReverbParams,
) => {
  const wet = ctx.createGain();
  wet.gain.value = params.mix;
  source.connect(wet);
  wet.connect(getReverbSend(ctx, params.seconds));
};
