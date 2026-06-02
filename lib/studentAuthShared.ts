export const normalizeEmail = (email: unknown) =>
  String(email || "").trim().toLowerCase();

export const displayNameFromEmail = (email: string) => email.split("@")[0] || "Alumno";

export const getAllowedStudentEmails = () =>
  (process.env.ALLOWED_STUDENT_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean);

export const isAllowedStudentEmail = (email: string) =>
  getAllowedStudentEmails().includes(normalizeEmail(email));
