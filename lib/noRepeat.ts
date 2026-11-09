/**
 * Una pregunta que no sea exactamente la anterior.
 *
 * "Exactamente" es todo lo que la define (`key`): en los modos de oído, el
 * intervalo o el acorde y además la nota desde la que suena. Así puede salir
 * dos veces seguidas la misma respuesta, que si no la anterior la descartaría,
 * pero no la misma pregunta calcada.
 *
 * Con pocas combinaciones puede no haber otra: se intenta unas cuantas veces y
 * se acepta lo que salga, que la ronda no se pare por esto.
 */
export const distinctFromPrevious = <T,>(
  previous: T | undefined,
  make: () => T,
  key: (question: T) => string,
  attempts = 20,
): T => {
  let next = make();
  if (previous === undefined) return next;
  const before = key(previous);
  for (let attempt = 0; attempt < attempts && key(next) === before; attempt++) {
    next = make();
  }
  return next;
};
