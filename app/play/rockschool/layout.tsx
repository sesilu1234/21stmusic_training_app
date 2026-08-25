import StudentsOnlyGate from "@/app/components/StudentsOnlyGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StudentsOnlyGate>{children}</StudentsOnlyGate>;
}
