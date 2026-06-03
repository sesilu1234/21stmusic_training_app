import { randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAllowedStudentEmail, normalizeEmail } from "@/lib/studentAuthShared";

interface StoredPassword {
  salt: string;
  hash: string;
  recoveryAttempts?: number;
  recoveryCodeHash?: string;
  recoveryCodeSalt?: string;
  recoveryCodeExpiresAt?: number;
}

type PasswordStore = Record<string, StoredPassword>;

const passwordFilePath = path.join(process.cwd(), "data", "student-passwords.json");

const readPasswordStore = async (): Promise<PasswordStore> => {
  try {
    return JSON.parse(await readFile(passwordFilePath, "utf8"));
  } catch {
    return {};
  }
};

const writePasswordStore = async (store: PasswordStore) => {
  await mkdir(path.dirname(passwordFilePath), { recursive: true });
  await writeFile(passwordFilePath, JSON.stringify(store, null, 2));
};

const hashPassword = (password: string, salt = randomBytes(16).toString("hex")) => ({
  salt,
  hash: pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex"),
});

const createRecoveryCode = () => {
  const code = String(Number.parseInt(randomBytes(4).toString("hex"), 16) % 1000000).padStart(6, "0");
  return code;
};

const sendRecoveryEmail = async (email: string, code: string) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.PASSWORD_RECOVERY_FROM_EMAIL || "21st Century Music <info@escuelademusicamoderna.com>";

  if (!resendApiKey) {
    console.warn(`[21st Century Music] No se ha enviado el codigo para ${email}: falta RESEND_API_KEY.`);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: email,
      subject: "Codigo para recuperar tu contraseña",
      text: `Tu codigo de recuperacion de 21st Century Music es: ${code}. Caduca en 15 minutos.`,
    }),
  });

  return response.ok;
};

export const hasStudentPassword = async (email: string) => {
  const store = await readPasswordStore();
  return Boolean(store[normalizeEmail(email)]);
};

export const setStudentPassword = async (email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedStudentEmail(normalizedEmail)) return false;
  if (password.trim().length < 6) return false;

  const store = await readPasswordStore();
  const previousAttempts = store[normalizedEmail]?.recoveryAttempts || 0;
  store[normalizedEmail] = hashPassword(password);
  store[normalizedEmail].recoveryAttempts = previousAttempts;
  await writePasswordStore(store);
  return true;
};

export const verifyStudentPassword = async (email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedStudentEmail(normalizedEmail)) return false;
  const store = await readPasswordStore();
  const savedPassword = store[normalizedEmail];
  if (!savedPassword) return false;

  const candidate = hashPassword(password, savedPassword.salt).hash;
  const savedBuffer = Buffer.from(savedPassword.hash, "hex");
  const candidateBuffer = Buffer.from(candidate, "hex");
  if (savedBuffer.length !== candidateBuffer.length) return false;
  return timingSafeEqual(savedBuffer, candidateBuffer);
};

export const requestPasswordRecoveryCode = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedStudentEmail(normalizedEmail)) return false;

  const store = await readPasswordStore();
  const currentPassword = store[normalizedEmail];
  if (!currentPassword) return false;
  if ((currentPassword.recoveryAttempts || 0) >= 3) return false;

  const code = createRecoveryCode();
  const hashedCode = hashPassword(code);
  currentPassword.recoveryCodeSalt = hashedCode.salt;
  currentPassword.recoveryCodeHash = hashedCode.hash;
  currentPassword.recoveryCodeExpiresAt = Date.now() + 15 * 60 * 1000;
  await writePasswordStore(store);

  return sendRecoveryEmail(normalizedEmail, code);
};

export const verifyPasswordRecoveryCode = async (email: string, code: string) => {
  const normalizedEmail = normalizeEmail(email);
  const store = await readPasswordStore();
  const currentPassword = store[normalizedEmail];
  if (!currentPassword?.recoveryCodeHash || !currentPassword.recoveryCodeSalt) return false;
  if (!currentPassword.recoveryCodeExpiresAt || currentPassword.recoveryCodeExpiresAt < Date.now()) return false;

  const candidate = hashPassword(String(code || "").trim(), currentPassword.recoveryCodeSalt).hash;
  const savedBuffer = Buffer.from(currentPassword.recoveryCodeHash, "hex");
  const candidateBuffer = Buffer.from(candidate, "hex");
  if (savedBuffer.length !== candidateBuffer.length) return false;
  return timingSafeEqual(savedBuffer, candidateBuffer);
};

export const getRecoveryAttempts = async (email: string) => {
  const store = await readPasswordStore();
  return store[normalizeEmail(email)]?.recoveryAttempts || 0;
};

export const registerFailedRecoveryAttempt = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const store = await readPasswordStore();
  const currentPassword = store[normalizedEmail];
  if (!currentPassword) return 0;
  currentPassword.recoveryAttempts = (currentPassword.recoveryAttempts || 0) + 1;
  await writePasswordStore(store);
  return currentPassword.recoveryAttempts;
};

export const resetRecoveryAttempts = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const store = await readPasswordStore();
  if (!store[normalizedEmail]) return;
  store[normalizedEmail].recoveryAttempts = 0;
  delete store[normalizedEmail].recoveryCodeHash;
  delete store[normalizedEmail].recoveryCodeSalt;
  delete store[normalizedEmail].recoveryCodeExpiresAt;
  await writePasswordStore(store);
};
