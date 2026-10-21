import ArmonicoGame from "./ArmonicoGame";
import { earSetFromParam, earSetKey } from "@/lib/earIntervals";

/**
 * Intervalos armónicos. Los intervalos llegan en la dirección (?iv=3,5,b7),
 * elegidos en /play/oido; si no vienen, o no valen, todos.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const set = earSetFromParam((await searchParams).iv);

  // El `key` hace que otra selección sea una partida nueva entera, y no la
  // anterior a medias con otros botones.
  return <ArmonicoGame key={earSetKey(set)} level={set} />;
}
