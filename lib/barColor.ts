// El color de una barra de porcentaje (progreso, alumnario, fin de partida).
//
// El verde es solo para el 100 %: un pleno no puede verse igual que un 95 %.
// Un 99,9 ya es "casi", y va en amarillo. El tramo medio es naranja para no
// confundirse con el amarillo.

export const barColor = (value: number, good = 90, ok = 60) =>
  value >= 100
    ? "bg-emerald-400"
    : value >= good
      ? "bg-yellow-200/85"
      : value >= ok
        ? "bg-orange-400"
        : "bg-rose-400";
