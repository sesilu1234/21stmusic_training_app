import { currentStudent } from "@/lib/session";
import RitmoMenu from "./RitmoMenu";

/**
 * El menú necesita saber si hay sesión para pintar el candado de los módulos
 * cerrados, y eso solo se sabe en el servidor. El menú en sí sigue siendo
 * cliente porque pasa componentes de icono a `SubMenu`.
 */
export default async function RitmoMenuPage() {
  return <RitmoMenu signedIn={Boolean(await currentStudent())} />;
}
