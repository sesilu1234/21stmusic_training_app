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
