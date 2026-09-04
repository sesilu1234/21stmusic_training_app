export interface ArmaduraData {
  image: string;
  mayor: string; // Respuesta correcta
}

export type Clave = "sol" | "fa";

/**
 * Las quince armaduras, solo en su version MAYOR.
 *
 * Antes habia treinta entradas: las mismas quince armaduras dos veces, una
 * preguntando por la tonalidad mayor y otra por su relativa menor. Se ha
 * quitado la mitad menor. La armadura de Do mayor y la de La menor son el
 * mismo pentagrama vacio, asi que preguntar "que tonalidad menor es" con la
 * imagen delante no distingue nada: o el alumno se sabe la relativa de
 * memoria, o esta adivinando. Las relativas menores se trabajan en clase, no
 * aqui.
 *
 * El nombre del archivo es identico para clave de Sol y de Fa; lo unico que
 * cambia es la carpeta.
 */
interface ArmaduraBase {
  file: string;
  mayor: string;
}

const armaduras_base: ArmaduraBase[] = [
  { file: "DoM.png", mayor: "Do" },

  // Sostenidos, en el orden en que se van sumando.
  { file: "SolM.png", mayor: "Sol" },
  { file: "ReM.png", mayor: "Re" },
  { file: "LaM.png", mayor: "La" },
  { file: "MiM.png", mayor: "Mi" },
  { file: "SiM.png", mayor: "Si" },
  { file: "FasM.png", mayor: "Fas" },
  { file: "DosM.png", mayor: "Dos" },

  // Bemoles.
  { file: "FaM.png", mayor: "Fa" },
  { file: "SibM.png", mayor: "Sib" },
  { file: "MibM.png", mayor: "Mib" },
  { file: "LabM.png", mayor: "Lab" },
  { file: "RebM.png", mayor: "Reb" },
  { file: "SolbM.png", mayor: "Solb" },
  { file: "DobM.png", mayor: "Dob" },
];

const CARPETAS: Record<Clave, string> = {
  sol: "/assets/armaduras",
  fa: "/assets/armaduras_fa",
};

function buildData(clave: Clave): ArmaduraData[] {
  return armaduras_base.map((a) => ({
    image: `${CARPETAS[clave]}/${a.file}`,
    mayor: a.mayor,
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
