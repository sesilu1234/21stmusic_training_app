import { auth, signIn } from "@/auth";
import {
  getRecoveryAttempts,
  hasStudentPassword,
  registerFailedRecoveryAttempt,
  requestPasswordRecoveryCode,
  resetRecoveryAttempts,
  setStudentPassword,
  verifyPasswordRecoveryCode,
} from "@/lib/studentAuth";
import { isAllowedStudentEmail, normalizeEmail } from "@/lib/studentAuthShared";
import Image from "next/image";
import {
  Activity,
  Award,
  Gamepad2,
  Hash,
  Headphones,
  History,
  LogOut,
  Music,
  Music2,
  StickyNote,
  Sun,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { redirect } from "next/navigation";

const getErrorMessage = (error?: string) => {
  if (error === "AccessDenied") return "Acceso denegado: tu correo no esta en la lista de alumnos autorizados.";
  if (error === "NoAccess") return "Este email no tiene permisos de acceso.";
  if (error === "CredentialsSignin") return "Correo o contraseña incorrectos.";
  if (error === "Setup") return "No se ha podido crear la contraseña. Debe tener al menos 6 caracteres.";
  if (error === "RecoveryCode") return "Código de recuperación incorrecto.";
  if (error === "RecoveryLocked") return "Has agotado los 3 intentos de recuperación.";
  if (error === "RecoverySend") return "No se ha podido enviar el código: falta configurar el servicio de envío de correos.";
  if (error === "RecoveryProvider") return "Resend no ha aceptado el envío. Revisa que el remitente esté verificado y que la API key sea correcta.";
  if (error === "RecoveryNotRegistered") return "Este correo todavía no tiene contraseña creada.";
  if (error === "RecoveryExpired") return "El código no es válido o ha caducado. Pide uno nuevo.";
  return "";
};

const cleanEmail = (email?: string) => normalizeEmail(email || "");

const previewGames = [
  { title: "Armaduras", text: "Identifica tonalidades y alteraciones.", Icon: Hash, bg: "bg-amber-500/20", accent: "text-amber-400" },
  { title: "Diapasón", text: "Ubica notas en el mástil rápidamente.", Icon: Target, bg: "bg-sky-500/20", accent: "text-sky-400" },
  { title: "Acordes", text: "Reconoce la estructura de los acordes.", Icon: Headphones, bg: "bg-emerald-500/20", accent: "text-emerald-400" },
  { title: "Modos E. Mayor", text: "Identifica escalas y modos en el pentagrama.", Icon: Music2, bg: "bg-indigo-500/20", accent: "text-indigo-400" },
  { title: "Intervalos", text: "Mide la distancia entre dos notas.", Icon: Activity, bg: "bg-fuchsia-500/20", accent: "text-fuchsia-400" },
  { title: "Trivial", text: "Cultura general de guitarra y artistas.", Icon: Music, bg: "bg-red-500/20", accent: "text-red-400" },
  { title: "Lectura Rítmica", text: "Pulsa al ritmo exacto de la partitura.", Icon: Activity, bg: "bg-orange-500/20", accent: "text-orange-400" },
  { title: "Ej. Canto/ E. del oído", text: "Constructor de melodías o Ej. Rockschool.", Icon: Music2, bg: "bg-teal-500/20", accent: "text-teal-400" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{
    attempts?: string;
    email?: string;
    error?: string;
    mode?: string;
    status?: string;
  }>;
}) {
  const session = await auth();
  const params = (await searchParams) || {};
  const mode = params.mode || "email";
  const email = cleanEmail(params.email);
  const attempts = Math.max(0, Number(params.attempts) || 0);
  const errorMessage = getErrorMessage(params.error);

  if (session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#b77a55] text-white">
      <div className="fixed inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/assets/background.jpeg')" }}>
        <div className="absolute inset-0 bg-slate-900/30" />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none select-none opacity-90">
        <div className="pt-3 px-3 md:pt-4 md:px-4">
          <nav className="max-w-6xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 md:px-4 md:py-3 flex justify-between items-center gap-2 shadow-2xl">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Image
                src="/assets/logo21stCM_no_white_1.png"
                width={1600}
                height={1600}
                priority
                className="h-9 md:h-12 lg:h-16 w-auto flex-shrink-0"
                alt="21st Century Music"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-white italic font-black tracking-tighter text-sm md:text-lg lg:text-3xl leading-tight whitespace-nowrap">
                  21st Century Music
                </span>
                <span className="font-bold tracking-widest text-[7px] md:text-[8px] uppercase text-amber-400 whitespace-nowrap">
                  ESCUELA DE MÚSICA MODERNA
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <span className="p-2 rounded-full bg-white/5 text-amber-400">
                <Sun size={18} />
              </span>
              <span className="rounded-full px-2.5 py-2 flex items-center gap-1 text-[10px] font-black uppercase bg-black text-amber-200 shadow-[0_0_18px_rgba(15,23,42,0.18)]">
                <Gamepad2 size={14} />
                <span className="hidden md:inline">Juegos</span>
              </span>
              <span className="hidden md:flex items-center gap-1 text-[10px] font-black uppercase text-slate-800">
                <History size={14} />
                Progreso
              </span>
              <span className="hidden md:flex items-center gap-1 text-[10px] font-black uppercase text-slate-800">
                <StickyNote size={14} />
                Notas
              </span>
              <span className="hidden md:flex items-center gap-1 text-[10px] font-black uppercase text-slate-800">
                <Trophy size={14} />
                Ranking
              </span>
              <span className="rounded-2xl px-2 py-1 flex items-center gap-2 text-[10px] font-black uppercase text-slate-800">
                <div className="w-9 h-9 rounded-2xl bg-black/40 border border-amber-300/30 flex items-center justify-center overflow-hidden">
                  <User size={20} />
                </div>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span>Perfil</span>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {Array.from({ length: 8 }, (_, i) => (
                      <Award key={i} size={13} className="text-slate-400" />
                    ))}
                  </div>
                </div>
              </span>
              <LogOut size={16} className="text-slate-800" />
            </div>
          </nav>
        </div>
        <section className="max-w-7xl mx-auto mt-5 md:mt-8 px-3 md:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
          {previewGames.map(({ title, text, Icon, bg, accent }) => (
            <div key={title} className="flex items-center gap-4 p-5 md:p-9 rounded-2xl border bg-black/40 border-white/10 text-left shadow-xl">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={26} className={accent} />
              </div>
              <div>
                <h2 className="text-base md:text-2xl italic font-black text-white uppercase">{title}</h2>
                <p className="text-[11px] md:text-sm text-slate-400">{text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="absolute inset-0 z-20 bg-black/5" />

      <section className="relative z-30 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/85 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-2xl font-black tracking-tight">Acceso de alumnos</h1>
        <p className="mt-2 text-sm text-slate-300">
          Entra con tu correo autorizado y tu contraseña personal.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}
        {params.status === "created" && (
          <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            Contraseña creada. Ya puedes entrar.
          </div>
        )}
        {params.status === "recovered" && (
          <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            Contraseña actualizada. Ya puedes entrar.
          </div>
        )}
        {params.status === "codeSent" && (
          <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            Hemos enviado un código temporal al correo indicado. Caduca en 15 minutos.
          </div>
        )}

        {mode === "email" && (
          <form
            className="mt-6 space-y-4"
            autoComplete="off"
            action={async (formData: FormData) => {
              "use server";
              const submittedEmail = normalizeEmail(formData.get("email"));
              if (!isAllowedStudentEmail(submittedEmail)) {
                redirect("/login?error=NoAccess");
              }
              const nextMode = (await hasStudentPassword(submittedEmail)) ? "login" : "create";
              redirect(`/login?mode=${nextMode}&email=${encodeURIComponent(submittedEmail)}`);
            }}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                Correo
              </span>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-amber-300"
                placeholder="tu correo autorizado"
              />
            </label>
            <button type="submit" className="w-full rounded-xl bg-white text-slate-900 font-bold py-3 hover:bg-slate-100 transition-colors">
              Continuar
            </button>
          </form>
        )}

        {mode === "login" && (
          <form
            className="mt-6 space-y-4"
            autoComplete="off"
            action={async (formData: FormData) => {
              "use server";
              await signIn("credentials", {
                email: String(formData.get("email") || ""),
                password: String(formData.get("password") || ""),
                redirectTo: "/",
              });
            }}
          >
            <input type="hidden" name="email" value={email} />
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
              {email}
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                Contraseña
              </span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-amber-300"
                placeholder="tu contraseña"
              />
            </label>
            <button type="submit" className="w-full rounded-xl bg-white text-slate-900 font-bold py-3 hover:bg-slate-100 transition-colors">
              Entrar
            </button>
          </form>
        )}

        {mode === "create" && (
          <form
            className="mt-6 space-y-4"
            autoComplete="off"
            action={async (formData: FormData) => {
              "use server";
              const submittedEmail = normalizeEmail(formData.get("email"));
              if (!isAllowedStudentEmail(submittedEmail)) {
                redirect("/login?error=NoAccess");
              }
              const ok = await setStudentPassword(
                submittedEmail,
                String(formData.get("newStudentPassword") || ""),
              );
              if (!ok) redirect(`/login?mode=create&email=${encodeURIComponent(submittedEmail)}&error=Setup`);
              redirect(`/login?mode=login&email=${encodeURIComponent(submittedEmail)}&status=created`);
            }}
          >
            <input type="hidden" name="email" value={email} />
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
              Primera vez con este correo: <span className="font-bold">{email}</span>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                Crear contraseña
              </span>
              <input
                name="newStudentPassword"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-amber-300"
                placeholder="mínimo 6 caracteres"
              />
            </label>
            <button type="submit" className="w-full rounded-xl bg-amber-300 text-slate-950 font-black py-3 hover:bg-amber-200 transition-colors">
              Guardar contraseña
            </button>
          </form>
        )}

        {mode === "recover" && (
          <form
            className="mt-6 space-y-4"
            autoComplete="off"
            action={async (formData: FormData) => {
              "use server";
              const submittedEmail = normalizeEmail(formData.get("email"));
              if (!isAllowedStudentEmail(submittedEmail)) {
                redirect("/login?mode=recover&error=NoAccess");
              }
              const currentAttempts = await getRecoveryAttempts(submittedEmail);
              if (currentAttempts >= 3) redirect("/login?mode=recover&error=RecoveryLocked");
              const recoveryRequest = await requestPasswordRecoveryCode(submittedEmail);
              if (!recoveryRequest.ok) {
                if (recoveryRequest.reason === "missing_api_key") {
                  redirect(`/login?mode=recover&email=${encodeURIComponent(submittedEmail)}&error=RecoverySend`);
                }
                if (recoveryRequest.reason === "provider_error") {
                  redirect(`/login?mode=recover&email=${encodeURIComponent(submittedEmail)}&error=RecoveryProvider`);
                }
                if (recoveryRequest.reason === "not_registered") {
                  redirect(`/login?mode=recover&email=${encodeURIComponent(submittedEmail)}&error=RecoveryNotRegistered`);
                }
                if (recoveryRequest.reason === "locked") {
                  redirect("/login?mode=recover&error=RecoveryLocked");
                }
                redirect("/login?mode=recover&error=NoAccess");
              }
              redirect(`/login?mode=reset&email=${encodeURIComponent(submittedEmail)}&status=codeSent`);
            }}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                Correo
              </span>
              <input
                name="email"
                type="email"
                defaultValue={email}
                required
                autoComplete="off"
                className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-amber-300"
                placeholder="tu correo autorizado"
              />
            </label>
            <div className="text-xs text-slate-400">
              Te mandaremos un código de 6 números para poder cambiar la contraseña.
            </div>
            <button type="submit" className="w-full rounded-xl bg-amber-300 text-slate-950 font-black py-3 hover:bg-amber-200 transition-colors">
              Enviar código
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form
            className="mt-6 space-y-4"
            autoComplete="off"
            action={async (formData: FormData) => {
              "use server";
              const submittedEmail = normalizeEmail(formData.get("email"));
              if (!isAllowedStudentEmail(submittedEmail)) {
                redirect("/login?mode=recover&error=NoAccess");
              }
              const currentAttempts = await getRecoveryAttempts(submittedEmail);
              if (currentAttempts >= 3) redirect("/login?mode=recover&error=RecoveryLocked");
              const codeIsValid = await verifyPasswordRecoveryCode(
                submittedEmail,
                String(formData.get("recoveryCode") || ""),
              );
              if (!codeIsValid) {
                const nextAttempts = await registerFailedRecoveryAttempt(submittedEmail);
                if (nextAttempts >= 3) redirect("/login?mode=recover&error=RecoveryLocked");
                redirect(`/login?mode=reset&email=${encodeURIComponent(submittedEmail)}&attempts=${nextAttempts}&error=RecoveryExpired`);
              }
              const ok = await setStudentPassword(
                submittedEmail,
                String(formData.get("newStudentPassword") || ""),
              );
              if (!ok) redirect(`/login?mode=reset&email=${encodeURIComponent(submittedEmail)}&error=Setup`);
              await resetRecoveryAttempts(submittedEmail);
              redirect(`/login?mode=login&email=${encodeURIComponent(submittedEmail)}&status=recovered`);
            }}
          >
            <input type="hidden" name="attempts" value={attempts} />
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                Correo
              </span>
              <input
                name="email"
                type="email"
                value={email}
                readOnly
                required
                autoComplete="off"
                className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-amber-300"
                placeholder="tu correo autorizado"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                Código de recuperación
              </span>
              <input
                name="recoveryCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-amber-300"
                placeholder="código de 6 números"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                Nueva contraseña
              </span>
              <input
                name="newStudentPassword"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-amber-300"
                placeholder="mínimo 6 caracteres"
              />
            </label>
            <div className="text-xs text-slate-400">Intentos usados: {attempts}/3</div>
            <button type="submit" className="w-full rounded-xl bg-amber-300 text-slate-950 font-black py-3 hover:bg-amber-200 transition-colors">
              Recuperar contraseña
            </button>
          </form>
        )}

        <div className="mt-5 flex justify-between text-xs font-bold text-slate-300">
          {mode !== "email" && <a href="/login" className="hover:text-white">Cambiar correo</a>}
          {mode !== "recover" && mode !== "reset" && <a href="/login?mode=recover" className="ml-auto hover:text-white">He olvidado mi contraseña</a>}
        </div>
        </div>
      </section>
    </main>
  );
}
