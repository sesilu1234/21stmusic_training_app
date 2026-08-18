"use client";

import { useState } from "react";

/**
 * Google sirve la foto a 96px y, si le llega cabecera Referer, a veces responde
 * 403 y la imagen sale rota. Se pide más resolución y se manda sin referer.
 */
const googleAvatar = (url: string, size: number) =>
  url.includes("googleusercontent.com")
    ? url.replace(/=s\d+(-c)?$/, `=s${size}$1`)
    : url;

interface Props {
  src?: string | null;
  name: string;
  /** lado del avatar en px, para pedir la foto a la resolución adecuada */
  size: number;
  className?: string;
}

export default function Avatar({ src, name, size, className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (!src || failed) {
    return (
      <span
        className={`flex items-center justify-center bg-gradient-to-br from-amber-400/25 to-amber-600/10 font-black text-amber-300 ${className}`}
        aria-hidden="true"
      >
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={googleAvatar(src, size * 2)}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
