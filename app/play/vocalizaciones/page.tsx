import VocalizacionesPlayer from "./VocalizacionesPlayer";
import { currentStudent } from "@/lib/session";
import { listMelodies } from "@/lib/melodiesDb";

// Las melodías del alumno cambian en cuanto guarda una, así que no se cachea.
export const dynamic = "force-dynamic";

/**
 * Lo único que hace el servidor aquí es leer las melodías guardadas. Todo lo
 * demás (el reloj, el audio, el editor) es de cliente.
 *
 * Sin cuenta se puede usar igual; lo que no se puede es guardar melodías.
 */
export default async function VocalizacionesPage() {
  const student = await currentStudent();

  // Si la tabla no está o la base de datos falla, la pantalla sale igual, sin
  // melodías propias: el resto no depende de esto.
  const melodies = student ? await listMelodies(student.email).catch(() => []) : [];

  return <VocalizacionesPlayer signedIn={!!student} initialMelodies={melodies} />;
}
