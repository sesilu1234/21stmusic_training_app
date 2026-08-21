import { getSupabaseAdmin } from "./supabaseAdmin";

const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();

export const CONTACT_LIMITS = {
  email: { max: 120 },
  message: { min: 10, max: 1000 },
} as const;

export interface ContactMessage {
  email: string;
  message: string;
}

export const saveContactMessage = async (payload: ContactMessage) => {
  const { error } = await getSupabaseAdmin().from("contact_messages").insert({
    email: normalizeEmail(payload.email),
    message: payload.message,
  });

  if (error) throw new Error(error.message);
};
