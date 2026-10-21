import ArmonicoGame from "./ArmonicoGame";
import { earLevelFromParam } from "@/lib/earIntervals";

/**
 * Intervalos armónicos. El nivel llega en la dirección (?nivel=2), elegido en
 * /play/oido; si no viene, o no es ninguno de los que hay, el nivel 1.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const level = earLevelFromParam((await searchParams).nivel);

  // El `key` hace que otro nivel sea una partida nueva entera, y no la
  // anterior a medias con otros botones.
  return <ArmonicoGame key={level.id} level={level} />;
}
