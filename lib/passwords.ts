import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Formato guardado en students.password_hash -> "scrypt$<salt hex>$<hash hex>"
const KEY_LENGTH = 64;

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

export const verifyPassword = (password: string, stored: string | null | undefined) => {
  const [scheme, salt, hash] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};
