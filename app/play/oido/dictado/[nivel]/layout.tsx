import LevelGate from "@/app/components/LevelGate";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = await params;

  return (
    <LevelGate gameSlug="/play/oido/dictado" levelSlug={nivel}>
      {children}
    </LevelGate>
  );
}
