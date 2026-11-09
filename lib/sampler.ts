"use client";

import { connectReverb, type ReverbParams } from "./reverb";

// Instrumentos grabados: piano de cola y dos guitarras (acero y nylon), nota a nota.
//
// Los timbres de osciladores (PRESETS en app/play/oido/audio.ts) son limpios
// pero planos: todas las notas tienen el mismo color. Para el oído eso es un
// problema, porque el carácter de cada registro, el ataque y los armónicos que
// se mezclan son justo lo que ayuda a reconocer intervalos y acordes.
//
// Cada instrumento trae unas cuantas notas grabadas; las que faltan se sacan
// reafinando la más cercana (como mucho semitono y medio: no se nota).
// Licencias en public/samples/*/LICENSE.txt; el crédito sale en /about.
//
// Las grabaciones se piden al abrir el modo (`prefetch`) y se descodifican la
// primera vez que suena algo, cuando ya hay AudioContext. Si algo falla (sin
// red, navegador viejo), `play` devuelve false y quien llama toca el timbre de
// osciladores: nunca se queda en silencio.

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "Cs4" → 1, "A3" → -3: semitonos desde el Do central, como el resto de la app. */
const semitoneOf = (note: string) => {
  const match = /^([A-G])(s?)(\d)$/.exec(note);
  if (!match) throw new Error(`Nota mal escrita: ${note}`);
  return LETTER[match[1]] + (match[2] ? 1 : 0) + (Number(match[3]) - 4) * 12;
};

/** Corta una nota: la apaga en unos milisegundos (de golpe chasquea). */
export type StopNote = () => void;

/** Lo que tarda en apagarse una nota cortada. */
const CUT_SECONDS = 0.05;

/**
 * Baja un volumen a cero desde donde esté ahora, aunque estuviera a mitad de
 * una rampa. `cancelAndHoldAtTime` es justo eso, pero Firefox no lo tiene.
 */
export const fadeOut = (ctx: BaseAudioContext, param: AudioParam, seconds = CUT_SECONDS) => {
  const now = ctx.currentTime;
  if (param.cancelAndHoldAtTime) {
    param.cancelAndHoldAtTime(now);
  } else {
    const current = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(current, now);
  }
  param.linearRampToValueAtTime(0, now + seconds);
};

/** Cuánto multiplicar una grabación para que su primer segundo tenga `db` de RMS. */
const trimTo = (buffer: AudioBuffer, db: number) => {
  const length = Math.min(buffer.length, buffer.sampleRate);
  let sum = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) sum += data[i] * data[i];
  }
  const rms = Math.sqrt(sum / (length * buffer.numberOfChannels));
  return rms > 0 ? 10 ** (db / 20) / rms : 1;
};

export interface Sampler {
  /** Pide las grabaciones. Se puede llamar las veces que sea: solo pide una. */
  prefetch: () => Promise<void>;
  /** Las deja listas para sonar en este contexto. */
  load: (ctx: BaseAudioContext) => Promise<void>;
  ready: () => boolean;
  /**
   * Una nota en `when`. Devuelve con qué cortarla antes de tiempo, o false si
   * todavía no está cargado.
   */
  play: (ctx: BaseAudioContext, semitone: number, when: number, out: AudioNode) => StopNote | false;
}

const createSampler = ({
  dir,
  notes,
  level,
  decay,
  room,
  lowpass,
  transpose = 0,
  hold,
  body,
  release,
  normalize,
  trebleCut,
}: {
  /** Carpeta dentro de public/samples. */
  dir: string;
  /** Las notas grabadas, como se llaman los archivos: "Cs4". */
  notes: string[];
  /** Cuánto se sube o baja para igualarlo con los demás timbres. */
  level: number;
  /**
   * Segundos en que la nota baja hasta apagarse, poco a poco desde el ataque,
   * como el piano eléctrico. Sin esto la grabación suena con el pedal pisado
   * (más de diez segundos); mantenerla entera y cortarla de golpe tampoco:
   * suena a nota cortada.
   */
  decay: number;
  /** Un poco de sala, para grabaciones hechas en seco (sin eco ninguno). */
  room?: ReverbParams;
  /** Un filtro suave que recorta los agudos (Hz), para grabaciones que suenan afiladas. */
  lowpass?: number;
  /** Semitonos que se mueve todo lo que suena: -12 = una octava más grave. */
  transpose?: number;
  /**
   * Sustain: lo que queda de volumen (0–1) justo antes del apagado final. Sin
   * esto la nota baja de forma pareja desde el ataque; con esto aguanta y solo
   * se apaga del todo en el último segundo.
   */
  hold?: number;
  /** Cuerpo: dB que se suben los graves (por debajo de ~320 Hz). */
  body?: number;
  /**
   * Segundos del apagado final (con `hold`). Si no se da, un tercio de
   * `decay`, como mucho 1,2 s.
   */
  release?: number;
  /**
   * Volumen (dB, RMS del primer segundo) al que se lleva cada nota al cargarla,
   * antes de `level`. Para grabaciones donde unas notas suenan mucho más fuertes
   * que otras: en la nylon de FatBoy, entre Do3 y Mi4 hay unos 11 dB.
   */
  normalize?: number;
  /**
   * Menos brillo: baja `db` decibelios lo que está por encima de `hz` (un
   * estante de agudos, suave; no corta como `lowpass`).
   */
  trebleCut?: { hz: number; db: number };
}): Sampler => {
  const samples = notes.map((file) => ({ file, semitone: semitoneOf(file) }));
  let fetching: Promise<Map<number, ArrayBuffer>> | null = null;
  let decoding: Promise<void> | null = null;
  const buffers = new Map<number, AudioBuffer>();
  /** Lo que se multiplica cada nota para llegar a `normalize` (1 si no hay). */
  const trims = new Map<number, number>();

  const fetchAll = () => {
    if (!fetching) {
      fetching = Promise.all(
        samples.map(async ({ file, semitone }) => {
          const response = await fetch(`/samples/${dir}/${file}.mp3`);
          if (!response.ok) throw new Error(`No se ha podido cargar ${dir}/${file}.mp3`);
          return [semitone, await response.arrayBuffer()] as const;
        }),
      )
        .then((entries) => new Map(entries))
        .catch((error) => {
          fetching = null; // Que se pueda volver a intentar.
          throw error;
        });
    }
    return fetching;
  };

  return {
    prefetch: () => fetchAll().then(() => undefined),

    load: (ctx) => {
      if (!decoding) {
        decoding = fetchAll()
          .then((raw) =>
            Promise.all(
              [...raw].map(async ([semitone, data]) => {
                // `decodeAudioData` se queda con el búfer: se le pasa una copia.
                const buffer = await ctx.decodeAudioData(data.slice(0));
                if (normalize !== undefined) trims.set(semitone, trimTo(buffer, normalize));
                buffers.set(semitone, buffer);
              }),
            ),
          )
          .then(() => undefined)
          .catch((error) => {
            decoding = null;
            throw error;
          });
      }
      return decoding;
    },

    ready: () => buffers.size === samples.length,

    play: (ctx, written, when, out) => {
      const semitone = written + transpose;
      const nearest = samples.reduce((best, sample) =>
        Math.abs(sample.semitone - semitone) < Math.abs(best.semitone - semitone) ? sample : best,
      );
      const buffer = buffers.get(nearest.semitone);
      if (!buffer) return false;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = 2 ** ((semitone - nearest.semitone) / 12);

      // Baja desde el ataque hasta casi nada en `decay` segundos. Con `hold`,
      // baja despacio hasta ese nivel y se apaga en el último segundo.
      const gain = ctx.createGain();
      const noteLevel = level * (trims.get(nearest.semitone) ?? 1);
      gain.gain.setValueAtTime(noteLevel, when);
      if (hold) {
        const fade = release ?? Math.min(1.2, decay / 3);
        gain.gain.exponentialRampToValueAtTime(noteLevel * hold, when + decay - fade);
      }
      gain.gain.exponentialRampToValueAtTime(noteLevel * 0.001, when + decay);

      let tail: AudioNode = source;
      if (body) {
        const shelf = ctx.createBiquadFilter();
        shelf.type = "lowshelf";
        shelf.frequency.value = 320;
        shelf.gain.value = body;
        tail.connect(shelf);
        tail = shelf;
      }
      if (trebleCut) {
        const shelf = ctx.createBiquadFilter();
        shelf.type = "highshelf";
        shelf.frequency.value = trebleCut.hz;
        shelf.gain.value = -trebleCut.db;
        tail.connect(shelf);
        tail = shelf;
      }
      if (lowpass) {
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = lowpass;
        filter.Q.value = 0.5; // Sin pico: solo redondea.
        tail.connect(filter);
        tail = filter;
      }
      tail.connect(gain);
      gain.connect(out);
      if (room) connectReverb(ctx as AudioContext, gain, room);
      source.start(when);
      source.stop(when + decay);
      source.onended = () => gain.disconnect();
      // La sala va colgada de `gain`: apagándolo se corta también lo que le
      // llega a la reverb, no solo el sonido directo.
      return () => {
        fadeOut(ctx, gain.gain);
        try {
          source.stop(ctx.currentTime + CUT_SECONDS + 0.01);
        } catch {
          // Ya parada.
        }
      };
    },
  };
};

/** Piano de cola (Salamander Grand Piano, Yamaha C5): Do, Re#, Fa# y La, de Do2 a Do7. */
export const GRAND_PIANO = createSampler({
  dir: "piano",
  notes: [2, 3, 4, 5, 6].flatMap((octave) => ["C", "Ds", "Fs", "A"].map((name) => `${name}${octave}`)).concat("C7"),
  // Las grabaciones vienen con margen (pico en -8 dB).
  // Antes 1,6: se quedaba un pelín bajo al lado de los demás timbres.
  level: 2,
  // Más cola (antes 5 s, y bajando desde el ataque) y algo más de sala.
  decay: 6.5,
  hold: 0.3,
  body: 7,
  room: { seconds: 1.8, mix: 0.1 },
  // Una octava más grave de lo escrito: en su octava sonaba demasiado agudo.
  // Siempre octavas justas, y la misma que la guitarra: al cambiar de sonido
  // tienen que sonar las mismas notas, que hay modos que las nombran.
  transpose: -12,
});

/** Todas las notas de Do2 a Do6, una a una: así ninguna se reafina. */
const CHROMATIC_C2_C6 = Array.from({ length: 49 }, (_, i) => {
  const midi = 36 + i;
  return `${["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"][midi % 12]}${Math.floor(midi / 12) - 1}`;
});

/**
 * Las guitarras de los modos de oído, elegidas a oído en una página de prueba
 * entre ocho. Suenan como vienen: sin caída añadida, sin filtro y sin sala
 * (con eso las anteriores sonaban peor aquí que sueltas). Solo se apagan en
 * el último medio segundo para que no acaben de golpe. Duran 3 s.
 * Soundfonts de midi-js (Benjamin Gleitzman); licencias al lado de cada una.
 */
const RAW_GUITAR = {
  decay: 3.1,
  hold: 1,
  release: 0.5,
  transpose: -12,
  // Todas las notas al mismo volumen, unos 5 dB por debajo del piano (que
  // anda por -19): al volumen que venían, las graves atronaban.
  normalize: -24,
  level: 1,
} as const;

/** Acústica de acero, del soundfont FluidR3. */
export const FLUID_STEEL_GUITAR = createSampler({
  dir: "guitarra-fluidr3-acero",
  notes: CHROMATIC_C2_C6,
  ...RAW_GUITAR,
  // El ataque pinchaba: un pelín menos de agudos (ajustado a oído en armónico).
  trebleCut: { hz: 3000, db: 5 },
});

/** Nylon (española), del soundfont FatBoy. */
export const FATBOY_NYLON_GUITAR = createSampler({
  dir: "guitarra-fatboy-nylon",
  notes: CHROMATIC_C2_C6,
  ...RAW_GUITAR,
});
