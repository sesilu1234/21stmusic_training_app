"use client";

import { KeyRound } from "lucide-react";
import SubMenu from "@/app/components/SubMenu";
import { CLAVE_LEVELS, type ClaveLevel } from "./notes_images";

/**
 * La imagen de cada tarjeta, donde en los demás submenús va el icono: a su
 * tamaño natural para esa altura. En "Ambas" van las dos, una al lado de la
 * otra e iguales que en las otras tarjetas.
 */
const ClaveImages = ({ level }: { level: ClaveLevel }) => (
  <>
    {level.imgs.map((src) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={src} src={encodeURI(src)} alt="" className="h-full w-auto" />
    ))}
  </>
);

/**
 * El menú del modo: con qué clave se juega.
 *
 * Es el mismo submenú que el resto de modos con niveles. Antes era una
 * pantalla hecha aparte, con otra cabecera, otras tarjetas y otro fondo al
 * pasar por encima, y se notaba que era de otra app.
 *
 * Aquí NO va el titular de la pregunta: vive en la pantalla de juego, que es
 * donde hay una pregunta que responder. Y cada clave es un enlace con su ruta,
 * de ahí que las partidas se guarden por separado.
 */
export default function ArmadurasMenuPage() {
  return (
    <SubMenu
      eyebrow="Lenguaje musical"
      title="Armaduras"
      intro="Sale una armadura y dices de qué tonalidad es, mayor o menor. Elige con qué clave quieres jugar."
      category="lenguaje"
      compact
      options={CLAVE_LEVELS.map((level) => ({
        title: level.titulo,
        description: level.sub,
        href: `/play/armadura/${level.slug}`,
        Icon: KeyRound,
        image: <ClaveImages level={level} />,
        badge: level.badge,
      }))}
    />
  );
}
