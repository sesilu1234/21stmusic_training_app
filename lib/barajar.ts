/**
 * Barajar de verdad (Fisher-Yates).
 *
 * ESTO NO ES UN DETALLE DE PUREZA. El `[...lista].sort(() => Math.random() -
 * 0.5)` que había en siete modos no baraja: le da a `sort` un comparador
 * incoherente —hoy dice que A va antes que B y dentro de un momento lo
 * contrario—, así que el resultado depende de por dónde pase el algoritmo de
 * ordenación y deja cada elemento cerca de donde estaba.
 *
 * Se nota cuando los datos vienen por bloques y luego se cortan las primeras
 * 24, que es exactamente lo que hacen estos modos. En Séptimas los 96 acordes
 * están escritos en cuatro tandas seguidas —7, maj7, min7, min7b5— y medido
 * sobre 2000 partidas salían 6,95 dominantes por partida y 5,00
 * semidisminuidos, cuando lo justo son 6 de cada. Los dos últimos bloques
 * salían mucho menos, y se notaba jugando: parecía que los menores séptima
 * casi no aparecían.
 *
 * Con esto cada orden posible tiene la misma probabilidad, y una partida trae
 * ~6 de cada tipo sin tener que repartirlas a mano.
 */
export const barajar = <T,>(lista: readonly T[]): T[] => {
  const out = [...lista];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
