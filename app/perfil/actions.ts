"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/session";
import { updateStudentProfile } from "@/lib/students";

export interface ProfileFormState {
  ok: boolean;
  message: string;
}

export async function saveProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const { student } = await requireStudent();
  const rawInstruments = String(formData.get("instruments") ?? "[]");
  let instruments: Array<{ name: unknown; startedAt: unknown }> = [];

  try {
    const parsed = JSON.parse(rawInstruments);
    instruments = Array.isArray(parsed) ? parsed : [];
  } catch {
    return { ok: false, message: "No se pudieron leer los instrumentos." };
  }

  try {
    await updateStudentProfile(
      student.email,
      formData.get("academySince"),
      instruments,
    );
  } catch {
    return {
      ok: false,
      message:
        "No se pudo guardar. Revisa que la base de datos tenga los campos nuevos.",
    };
  }

  revalidatePath("/perfil");
  return { ok: true, message: "Perfil actualizado." };
}
