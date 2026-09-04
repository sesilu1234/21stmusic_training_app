export interface ArmaduraData {
  image: string;
  mayor: string; //RespuestacorrectacolumnaMayor
  menor: string; //RespuestacorrectacolumnaMenor
}

export type Clave = "sol" | "fa";

// Datos base: el nombre del archivo es idéntico para clave de Sol y de Fa,
// solo cambia la carpeta. La tonalidad (mayor/menor) es la misma en ambas claves.
interface ArmaduraBase {
  file: string;
  mayor: string;
  menor: string;
}

const armaduras_base: ArmaduraBase[] = [
  { file: "Lamen.png", mayor: "Do", menor: "La" },
  { file: "Mimen.png", mayor: "Sol", menor: "Mi" },
  { file: "Simen.png", mayor: "Re", menor: "Si" },
  { file: "Fasmen.png", mayor: "La", menor: "Fas" },
  { file: "Dosmen.png", mayor: "Mi", menor: "Dos" },
  { file: "Solsmen.png", mayor: "Si", menor: "Sols" },
  { file: "Resmen.png", mayor: "Fas", menor: "Res" },
  { file: "Lasmen.png", mayor: "Dos", menor: "Las" },
  { file: "Remen.png", mayor: "Fa", menor: "Re" },
  { file: "Solmen.png", mayor: "Sib", menor: "Sol" },
  { file: "Domen.png", mayor: "Mib", menor: "Do" },
  { file: "Famen.png", mayor: "Lab", menor: "Fa" },
  { file: "Sibmen.png", mayor: "Reb", menor: "Sib" },
  { file: "Mibmen.png", mayor: "Solb", menor: "Mib" },
  { file: "Labmen.png", mayor: "Dob", menor: "Lab" },

  { file: "DoM.png", mayor: "Do", menor: "La" },
  { file: "SolM.png", mayor: "Sol", menor: "Mi" },
  { file: "ReM.png", mayor: "Re", menor: "Si" },
  { file: "LaM.png", mayor: "La", menor: "Fas" },
  { file: "MiM.png", mayor: "Mi", menor: "Dos" },
  { file: "SiM.png", mayor: "Si", menor: "Sols" },
  { file: "FasM.png", mayor: "Fas", menor: "Res" },
  { file: "DosM.png", mayor: "Dos", menor: "Las" },

  { file: "FaM.png", mayor: "Fa", menor: "Re" },
  { file: "SibM.png", mayor: "Sib", menor: "Sol" },
  { file: "MibM.png", mayor: "Mib", menor: "Do" },
  { file: "LabM.png", mayor: "Lab", menor: "Fa" },
  { file: "RebM.png", mayor: "Reb", menor: "Sib" },
  { file: "SolbM.png", mayor: "Solb", menor: "Mib" },
  { file: "DobM.png", mayor: "Dob", menor: "Lab" },
];

const CARPETAS: Record<Clave, string> = {
  sol: "/assets/armaduras",
  fa: "/assets/armaduras_fa",
};

function buildData(clave: Clave): ArmaduraData[] {
  return armaduras_base.map((a) => ({
    image: `${CARPETAS[clave]}/${a.file}`,
    mayor: a.mayor,
    menor: a.menor,
  }));
}

export const armaduras_sol: ArmaduraData[] = buildData("sol");
export const armaduras_fa: ArmaduraData[] = buildData("fa");

// Devuelve el conjunto de armaduras según las claves seleccionadas.
export function getArmaduras(claves: Clave[]): ArmaduraData[] {
  return claves.flatMap((c) => (c === "fa" ? armaduras_fa : armaduras_sol));
}

// Compatibilidad: por defecto, clave de Sol.
export const armaduras_data = armaduras_sol;

/**
 * Los tres subniveles del modo, cada uno con su ruta.
 *
 * ANTES ESTO NO ERA UN NIVEL, ERA UN `useState`. Se elegía la clave con un
 * botón, la partida arrancaba sin salir de /play/armadura y las tres se
 * guardaban con esa misma dirección. Y la dirección es la clave de todo: el
 * modal de fin de partida manda `pathname` a `saveAttempt`, que saca de ahí el
 * modo y el nivel. O sea que jugar solo en clave de Sol, solo en Fa o las dos
 * mezcladas contaba como el mismo nivel, y con una sola partida perfecta ya se
 * daba el modo por dominado.
 *
 * Con una ruta por subnivel, cada uno lleva su cuenta y la medalla del modo
 * pide las tres. También se puede enlazar directamente a una clave, que antes
 * no había manera.
 */
export interface ClaveLevel {
  slug: string;
  titulo: string;
  sub: string;
  badge: string;
  claves: Clave[];
  /** Lo que se enseña en la tarjeta del menú. */
  imgs: string[];
}

export const CLAVE_LEVELS: ClaveLevel[] = [
  {
    slug: "sol",
    titulo: "Clave de Sol",
    sub: "Solo clave de Sol",
    badge: "Nivel 1",
    claves: ["sol"],
    imgs: ["/assets/armaduras/SolM.png"],
  },
  {
    slug: "fa",
    titulo: "Clave de Fa",
    sub: "Solo clave de Fa",
    badge: "Nivel 2",
    claves: ["fa"],
    imgs: ["/assets/armaduras_fa/SolM.png"],
  },
  {
    slug: "ambas",
    titulo: "Ambas claves",
    sub: "Sol y Fa mezcladas",
    badge: "Nivel 3",
    claves: ["sol", "fa"],
    imgs: ["/assets/armaduras/SolM.png", "/assets/armaduras_fa/SolM.png"],
  },
];

export const findClaveLevel = (slug: string) =>
  CLAVE_LEVELS.find((level) => level.slug === slug);
