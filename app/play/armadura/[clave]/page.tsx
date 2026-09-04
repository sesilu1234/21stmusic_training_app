"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import ArmadurasGame from "../ArmadurasGame";
import { findClaveLevel } from "../notes_images";

/**
 * Una ruta por subnivel: /play/armadura/sol, /fa y /ambas.
 *
 * Antes la clave se elegía con un botón y la partida no cambiaba de
 * dirección, así que las tres se guardaban como el mismo nivel. Ver el comentario
 * de `CLAVE_LEVELS` en `notes_images.tsx`.
 */
export default function ArmaduraClavePage({
  params,
}: {
  params: Promise<{ clave: string }>;
}) {
  const { clave } = use(params);
  const level = findClaveLevel(clave);
  if (!level) notFound();

  return <ArmadurasGame claves={level.claves} />;
}
