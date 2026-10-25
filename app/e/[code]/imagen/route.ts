// La imagen de la pregunta en juego de un examen.
//
// Existe para que el navegador no vea nunca la ruta del archivo: en armaduras,
// modos y mástil el nombre ya dice la respuesta ("SolM.png", "aug/aug3.png").
// El servidor mira qué pregunta le toca a quien la pide y le sirve los bytes,
// sin redirigir (una redirección enseñaría la ruta igual).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { currentStudent } from "@/lib/session";
import { getAttempt, getExamByCode, normalizeCode } from "@/lib/exams/db";
import { currentImage } from "@/lib/exams/runner";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const notFound = () => new NextResponse(null, { status: 404 });

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const student = await currentStudent();
  if (!student) return notFound();

  const exam = await getExamByCode(normalizeCode(code)).catch(() => null);
  if (!exam) return notFound();
  const attempt = await getAttempt(exam.id, student.email).catch(() => null);
  const src = attempt ? currentImage(exam, attempt) : null;
  if (!src || !src.startsWith("/assets/") || src.includes("..")) return notFound();

  const headers = {
    "Content-Type": TYPES[path.extname(src).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": "private, no-store",
  };

  // Primero del disco (en local y donde `public/` viaja con el servidor), y si
  // no está, del propio sitio, que es como se sirve en Vercel.
  try {
    const file = await readFile(path.join(process.cwd(), "public", decodeURI(src)));
    return new NextResponse(new Uint8Array(file), { headers });
  } catch {
    const response = await fetch(new URL(encodeURI(decodeURI(src)), request.nextUrl.origin)).catch(
      () => null,
    );
    if (!response?.ok) return notFound();
    return new NextResponse(await response.arrayBuffer(), { headers });
  }
}
