import { getSupabaseAdmin } from "./supabaseAdmin";
import { normalizeEmail } from "./students";

export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 120 },
  message: { min: 10, max: 2000 },
} as const;

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  /** Alumno identificado, si lo hay. */
  studentEmail?: string | null;
}

export const saveContactMessage = async (payload: ContactMessage) => {
  const { error } = await getSupabaseAdmin().from("contact_messages").insert({
    name: payload.name,
    email: normalizeEmail(payload.email),
    message: payload.message,
    student_email: payload.studentEmail || null,
  });

  if (error) throw new Error(error.message);
};
