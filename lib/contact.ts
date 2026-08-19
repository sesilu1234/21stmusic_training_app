import { getSupabaseAdmin } from "./supabaseAdmin";
import { normalizeEmail } from "./students";

export const CONTACT_LIMITS = {
  email: { max: 120 },
  message: { min: 10, max: 1000 },
} as const;

export interface ContactMessage {
  email: string;
  message: string;
  /** Alumno identificado, si lo hay. */
  studentEmail?: string | null;
}

export const saveContactMessage = async (payload: ContactMessage) => {
  const { error } = await getSupabaseAdmin().from("contact_messages").insert({
    email: normalizeEmail(payload.email),
    message: payload.message,
    student_email: payload.studentEmail || null,
  });

  if (error) throw new Error(error.message);
};
