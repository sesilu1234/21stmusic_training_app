/**
 * El `AudioContext` de la app. Un solo sitio donde crearlo, porque hay dos
 * cosas que hay que acordarse de hacer y estaban copiadas en tres archivos.
 *
 * 1. Safari viejo solo expone `webkitAudioContext`.
 *
 * 2. El interruptor de silencio del iPhone. iOS es el único sistema donde Web
 *    Audio suena bajo la categoría de sesión "ambient", que el interruptor
 *    lateral silencia: con el móvil en silencio la app enmudecía entera, sin
 *    error ni aviso de ninguna clase. Poniendo la sesión en "playback" el audio
 *    deja de depender de ese interruptor, que es lo que se espera de algo que
 *    va de tocar y de escuchar — si abres una app de música, quieres oírla.
 *
 *    `navigator.audioSession` es de Safari 16.4 en adelante (2023) y no existe
 *    en ningún otro navegador, así que se comprueba antes de tocarlo y no pasa
 *    nada donde no está. En iOS anteriores se queda como estaba.
 *
 *    Va antes de construir el contexto a propósito: la categoría se aplica a la
 *    sesión, y ponerla después es llegar tarde.
 */

interface AudioSessionNavigator extends Navigator {
  audioSession?: { type: string };
}

/**
 * Efecto secundario que conviene saber: en iOS, "playback" no se mezcla con el
 * audio de otras apps. Si el alumno viene escuchando algo, al sonar la primera
 * nota se le para. Es lo normal en un instrumento y es lo que hacen las demás
 * apps de música, pero es un cambio de comportamiento real.
 */
const claimLoudAudioSession = () => {
  try {
    const nav = navigator as AudioSessionNavigator;
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    // Safari puede lanzar si no le gusta el valor. Si no se puede, se sigue con
    // el comportamiento de siempre: mejor sonar bajito que no arrancar.
  }
};

export const createAudioContext = (): AudioContext => {
  claimLoudAudioSession();

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  return new Ctor();
};

/**
 * Cuánto se baja todo lo que suena en la app, sobre la salida final.
 *
 * La app se había montado sin ningún punto común de volumen: cada timbre ponía
 * su ganancia a mano y se conectaba directo a la salida, así que "sonaba alto"
 * no era una cosa que se pudiera tocar en un sitio. Con el sistema al 40 ya
 * estaba fuerte y al 80 hacía daño, que es señal de que el margen que se le
 * dejaba al usuario estaba mal repartido: el volumen del aparato debería poder
 * recorrer todo su viaje sin llegar a molestar.
 *
 * -10.5 dB. El primer intento se quedó en -6 y seguía sonando fuerte, así que
 * baja otro tanto. Con esto el recorrido del volumen del aparato vuelve a ser
 * util entero: al 40 se oye cómodo y al 80 sigue sin molestar.
 */
const OUTPUT_LEVEL = 0.3;

/**
 * Un nodo maestro por contexto, creado la primera vez que se pide. Va en un
 * `WeakMap` y no en una variable suelta porque hay más de un `AudioContext` en
 * la app (cada modo monta el suyo) y cada uno necesita el propio: un nodo
 * pertenece al contexto que lo creó y conectarlo a otro es un error.
 */
const masters = new WeakMap<AudioContext, GainNode>();

/**
 * La salida de la app. Todo lo que suene tiene que conectarse aquí y no a
 * `ctx.destination` directamente: es el único sitio por el que pasa el audio
 * entero, y por tanto el único donde se puede ajustar el nivel general.
 */
export const outputNode = (ctx: AudioContext): GainNode => {
  const existing = masters.get(ctx);
  if (existing) return existing;

  const master = ctx.createGain();
  master.gain.value = OUTPUT_LEVEL;
  master.connect(ctx.destination);
  masters.set(ctx, master);
  return master;
};
