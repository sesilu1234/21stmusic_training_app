import AppShell from "../components/AppShell";
import NotesBoard from "./NotesBoard";

export const metadata = { title: "Notas · 21st Century Music" };

export default function NotasPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <h1 className="text-2xl font-black italic tracking-tight md:text-4xl">Mis notas</h1>
          <p className="mt-1 text-xs text-white/50">
            Apuntes rápidos de estudio. Se guardan en este navegador.
          </p>
        </header>

        <NotesBoard storageKey="notes" />
      </div>
    </AppShell>
  );
}
