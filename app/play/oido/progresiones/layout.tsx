import type { Metadata } from "next";
import StudentsOnlyGate from "@/app/components/StudentsOnlyGate";
import { gameMetadata } from "@/lib/seo";

/**
 * El título de la pestaña y, sobre todo, el `noindex`: este modo pide cuenta,
 * así que no hay nada que ofrecerle a un buscador. Sale de `lib/games.ts`, que
 * es donde está marcado `studentsOnly`, para que no puedan decir cosas
 * distintas.
 */
export const metadata: Metadata = gameMetadata("/play/oido/progresiones");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StudentsOnlyGate>{children}</StudentsOnlyGate>;
}
