import { randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAllowedStudentEmail, normalizeEmail } from "@/lib/studentAuthShared";

interface StoredPassword {
  salt: string;
  hash: string;
  recoveryAttempts?: number;
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
  await writePasswordStore(store);
};
