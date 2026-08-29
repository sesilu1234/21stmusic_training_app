"use client";

/**
 * Cuerda pulsada, por Karplus-Strong.
 *
 * Las voces de `freeSynth` son sumas de armónicos con UNA envolvente para
 * todos. Eso vale para un órgano o una campana, pero no para una guitarra: lo
 * que hace que una cuerda pulsada suene a cuerda pulsada es que cada armónico
 * se apaga a su ritmo — los agudos mueren en seguida y el fundamental sigue
 * sonando. Con una sola envolvente eso no se puede imitar, salga el timbre que
 * salga.
 *
 * Karplus-Strong lo da gratis: un golpe de ruido metido en una línea de
 * retardo que se realimenta a través de un filtro paso bajo. Cada vuelta del
 * bucle se lleva un poco de agudo, así que el sonido se va oscureciendo solo
 * mientras decae, que es exactamente lo que hace una cuerda.
 *
 * Se calcula en JavaScript y se mete en un AudioBuffer en vez de montarlo con
 * nodos: no hace falta AudioWorklet, ni ficheros aparte, ni samples, ni
 * librerías. Son unos pocos milisegundos por nota y se guarda en caché.
 */

export interface PluckParams {
  /**
   * Segundos que tarda el Do central en apagarse. Las notas agudas duran
   * menos solas, porque su bucle da más vueltas por segundo y el filtro se
   * las come antes — igual que en una cuerda de verdad.
   */
  sustain: number;
  /** 0 = púa blanda junto al mástil, 1 = uña cerca del puente. */
  brightness: number;
  /**
   * Ganancia de salida. No entra en la muestra: se aplica al reproducir, para
   * que dos voces con el mismo timbre y distinto volumen compartan la muestra
   * en vez de generar dos.
   */
  peak: number;
}

const C4 = 261.63;

/** Cuánto dura la muestra de esta nota. Las agudas no necesitan tanta cola. */
const secondsFor = (freq: number, sustain: number) =>
  Math.min(sustain * 1.1, Math.max(1.4, sustain * (C4 / freq) ** 0.35));

/**
 * Peso del filtro de dos muestras que cierra el bucle.
 *
 * No puede ser un valor fijo. El filtro se aplica una vez por vuelta, y una
 * nota aguda da muchas más vueltas por segundo que una grave: con un peso fijo,
 * un Do6 se apagaba en centésimas de segundo mientras un Do3 sonaba casi
 * eternamente.
 *
 * Así que se busca, por bisección, el filtro que deja al fundamental un T60
 * largo — el final de la nota lo marca `decay`, no el filtro. Los armónicos ven
 * una frecuencia n veces mayor y el mismo filtro se los come muchísimo antes:
 * eso es exactamente lo que hace que una cuerda suene a cuerda, que el brillo
 * se va mucho antes que el cuerpo.
 */
const solveTilt = (omega: number, freq: number, t60: number) => {
  const target = Math.pow(0.001, 1 / (t60 * freq));
  const cos = Math.cos(omega);
  const sin = Math.sin(omega);
  const magnitude = (t: number) => Math.hypot(1 - t * (1 - cos), t * sin);

  // Lo más cerrado que da este filtro es la media (0.5). En los graves ni con
  // esa se llega al objetivo, y da igual: ahí el filtro apenas pinta.
  if (magnitude(0.5) > target) return 0.5;

  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (magnitude(mid) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

/**
 * Genera la nota entera, muestra a muestra.
 *
 * El retardo del bucle tiene que valer exactamente `sampleRate / freq` o la
 * nota sale desafinada, y en las agudas un solo sample de más son ya varios
 * cents. Aquí eso importa el doble, que la app es de reconocer intervalos.
 * Por eso el retardo se parte en tres: las muestras enteras, una interpolación
 * lineal para la parte fraccionaria, y el retardo que aporta el propio filtro.
 */
export const renderPluckedString = (
  sampleRate: number,
  freq: number,
  params: PluckParams,
): Float32Array => {
  const seconds = secondsFor(freq, params.sustain);
  const length = Math.max(64, Math.floor(sampleRate * seconds));
  const out = new Float32Array(length);

  // Más `brightness` = más T60 para el fundamental = filtro menos cerrado.
  const omega = (2 * Math.PI * freq) / sampleRate;
  const tilt = solveTilt(omega, freq, seconds * (4 + 8 * params.brightness));

  // Retardo que tienen que aportar la línea y la interpolación: el filtro ya
  // pone `tilt` muestras por su cuenta.
  const delay = sampleRate / freq - tilt;
  const whole = Math.floor(delay);
  const frac = delay - whole;

  if (whole < 2) return out; // nota imposiblemente aguda; mejor silencio que ruido

  const start = whole + 2;

  // Excitación: ruido pasado por un paso bajo de un polo. Cuanto más cerrado,
  // más blanda es la púa.
  const cutoff = 0.08 + 0.85 * params.brightness;
  let lowpass = 0;
  for (let i = 0; i < start && i < length; i++) {
    lowpass += cutoff * (Math.random() * 2 - 1 - lowpass);
    // Arranque en rampa: entrar de golpe suena a click digital, no a púa.
    out[i] = lowpass * Math.min(1, i / 6);
  }

  // Pérdida por vuelta del bucle, ajustada para caer 60 dB en el tiempo pedido.
  //
  // Ojo: se multiplica una vez por muestra escrita, pero cada muestra solo
  // vuelve a pasar por el bucle cada `sampleRate / freq` muestras. O sea que en
  // un segundo la señal da `freq` vueltas, no `sampleRate`. Dividir por
  // muestras en vez de por vueltas dejaría la cuerda sonando eternamente.
  const decay = Math.exp(Math.log(0.001) / (seconds * 0.85 * freq));

  for (let i = start; i < length; i++) {
    const a = out[i - whole];
    const b = out[i - whole - 1];
    const c = out[i - whole - 2];
    // Dos lecturas con retardo fraccionario, separadas una muestra.
    const x0 = a + frac * (b - a);
    const x1 = b + frac * (c - b);
    out[i] = decay * ((1 - tilt) * x0 + tilt * x1);
  }

  // Se normaliza a 1 para que todas las notas suenen igual de fuertes: si no,
  // las graves salen más altas por tener la línea de retardo más larga.
  let loudest = 0;
  for (let i = 0; i < length; i++) {
    const value = Math.abs(out[i]);
    if (value > loudest) loudest = value;
  }
  const scale = loudest > 0 ? 1 / loudest : 0;

  // Y se cierra con un desvanecido, o el final del buffer da un chasquido.
  const fade = Math.min(length, Math.floor(sampleRate * 0.05));
  for (let i = 0; i < length; i++) {
    const tail = i > length - fade ? (length - i) / fade : 1;
    out[i] *= scale * tail;
  }

  return out;
};

/**
 * La caja de una acústica.
 *
 * Sin esto se oye la cuerda pelada y suena a juguete: lo que identifica a una
 * guitarra acústica es la caja, sobre todo el bombo de aire de los 100 Hz.
 */
export const createGuitarBody = (ctx: AudioContext) => {
  const input = ctx.createGain();

  // Resonancia de Helmholtz: el aire entrando y saliendo por la boca.
  const air = ctx.createBiquadFilter();
  air.type = "peaking";
  air.frequency.value = 100;
  air.Q.value = 1.4;
  air.gain.value = 6;

  // Primer modo de la tapa armónica.
  const top = ctx.createBiquadFilter();
  top.type = "peaking";
  top.frequency.value = 205;
  top.Q.value = 2.2;
  top.gain.value = 4;

  // Cuerpo de la madera, más ancho y más suave.
  const wood = ctx.createBiquadFilter();
  wood.type = "peaking";
  wood.frequency.value = 420;
  wood.Q.value = 1.1;
  wood.gain.value = 2.5;

  // Una guitarra no tiene nada por encima de los 6 kHz.
  const tame = ctx.createBiquadFilter();
  tame.type = "lowpass";
  tame.frequency.value = 5400;
  tame.Q.value = 0.7;

  input.connect(air);
  air.connect(top);
  top.connect(wood);
  wood.connect(tame);

  return { input, output: tame as AudioNode };
};

/**
 * Caché de notas ya generadas.
 *
 * Generar una nota cuesta unos milisegundos, poco pero suficiente para dar un
 * tirón si se pulsa un acorde entero. Se guardan las últimas y se tiran las
 * más viejas: un buffer son cientos de kilobytes y el teclado se puede pasear
 * por muchas octavas.
 */
const MAX_CACHED = 36;
const cache = new Map<string, AudioBuffer>();

const getPluckedBuffer = (
  ctx: AudioContext,
  freq: number,
  params: PluckParams,
): AudioBuffer => {
  // Se indexa por frecuencia y no por semitono porque los modos de juego solo
  // manejan frecuencias. Salen siempre de la misma tabla temperada, así que la
  // clave es igual de estable.
  //
  // Y por los parámetros que cambian la forma de onda, no por el id de la voz:
  // dos voces con el mismo timbre comparten muestra, y una que lo cambie no
  // puede quedarse con la de otra por descuido.
  const key = `${params.sustain}:${params.brightness}:${freq.toFixed(2)}:${ctx.sampleRate}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const samples = renderPluckedString(ctx.sampleRate, freq, params);
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  buffer.getChannelData(0).set(samples);

  if (cache.size >= MAX_CACHED) {
    // Map conserva el orden de inserción, así que la primera clave es la más
    // vieja.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, buffer);

  return buffer;
};

/**
 * Monta la nota entera y la dispara: muestra, volumen y caja.
 *
 * `when` puede ir en el futuro, que es como lo piden los modos de juego para
 * cuadrar las notas de un acorde.
 */
export const playPluckedString = (
  ctx: AudioContext,
  freq: number,
  params: PluckParams,
  when: number,
) => {
  const source = ctx.createBufferSource();
  source.buffer = getPluckedBuffer(ctx, freq, params);

  const level = ctx.createGain();
  level.gain.setValueAtTime(params.peak, when);

  const body = createGuitarBody(ctx);
  source.connect(level);
  level.connect(body.input);
  body.output.connect(ctx.destination);

  source.start(when);
  return source;
};
