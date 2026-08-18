export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
