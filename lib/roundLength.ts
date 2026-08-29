/**
 * Cuántas preguntas tiene una partida. Igual para todos los modos.
 *
 * Hubo un selector de 12 / 24 / 48 guardado en localStorage, pero el único
 * sitio desde el que se podía tocar era el marcador del final de la partida:
 * para bajar a 12 había que jugarse antes una de 24 enteras. En vez de moverlo
 * de sitio se ha quitado entero, que 24 vale para todo el mundo.
 *
 * Si algún día vuelve a hacer falta poder elegir, este es el sitio por donde
 * empezar: los dieciocho modos leen esta constante y nada más.
 */
export const ROUND_LENGTH = 24;
