/**
 * Un número estable a partir de un nombre, para elegir avatar.
 *
 * Es FNV-1a con una avalancha al final, y la avalancha NO es opcional:
 *
 * FNV-1a multiplica por 16777619, y 16777619 % 8 == 3. Eso quiere decir que
 * los tres bits de abajo del resultado solo dependen de los tres bits de abajo
 * de cada letra — la "u" (117) y la "m" (109) aportan lo mismo, porque las dos
 * son 5 en módulo 8. Así que al hacer `hash % 8` para elegir entre ocho
 * dibujos, nombres completamente distintos caían en el mismo. Con cinco
 * cuentas reales salieron los cinco iguales.
 *
 * Los tres pasos de abajo son el finalizador de MurmurHash3: arrastran los
 * bits de arriba (que sí dependen de todo el nombre) hacia abajo. A partir de
 * ahí, `% n` reparte de verdad.
 *
 * Ojo con tocar esto: `^`, `>>>` y `Math.imul` trabajan con enteros de 32 bits
 * CON SIGNO, y en JavaScript `-13 % 8` es `-5`, no `3`. Un índice negativo
 * devuelve `undefined` y la pantalla se cae. Por eso se cierra con `>>> 0`,
 * que es lo único que garantiza que el número sale positivo.
 */
export const nameHash = (name: string) => {
  let hash = 2166136261;

  const clean = name.trim().toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // La avalancha.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489909);
  hash ^= hash >>> 16;

  return hash >>> 0;
};
