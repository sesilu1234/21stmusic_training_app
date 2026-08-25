"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, LogIn, User } from "lucide-react";
import { loginWithPassword } from "./actions";

/**
 * Campo con su rótulo dentro de la caja y una línea que crece desde el centro
 * al enfocar. El rótulo siempre visible evita el problema clásico del
 * placeholder: en cuanto escribes, dejas de saber qué te pedían.
 */
const Field = ({
  label,
  Icon,
  children,
}: {
  label: string;
  Icon: typeof User;
  children: React.ReactNode;
}) => (
  <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-3.5 pb-2.5 pt-2 transition-colors duration-200 focus-within:border-amber-300/50 focus-within:bg-white/[0.07]">
    <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-white/30 transition-colors duration-200 group-focus-within:text-amber-300/80">
      {label}
    </span>

    <div className="mt-0.5 flex items-center gap-2.5">
      <Icon
        size={14}
        strokeWidth={2}
        className="flex-shrink-0 text-white/25 transition-colors duration-200 group-focus-within:text-amber-300"
      />
      {children}
    </div>

    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent transition-transform duration-300 ease-out group-focus-within:scale-x-100" />
  </div>
);

const inputClass =
  "w-full bg-transparent text-[13px] font-semibold tracking-wide text-white placeholder:font-normal placeholder:tracking-normal placeholder:text-white/20 focus:outline-none";

export default function LoginForm({
  initialError,
  next,
}: {
  initialError?: string;
  next: string;
}) {
  const [passwordError, formAction, pending] = useActionState(loginWithPassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const error = passwordError || initialError;

  return (
    <div className="space-y-3.5">
      <form action={formAction} className="space-y-2">
        {/* A dónde volver después de entrar: lo pone la página que te mandó aquí. */}
        <input type="hidden" name="next" value={next} />

        <Field label="Usuario" Icon={User}>
          <input
            name="username"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={inputClass}
          />
        </Field>

        <Field label="Contraseña" Icon={Lock}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="-mr-1 flex-shrink-0 rounded-md p-1 text-white/25 transition-colors hover:text-amber-300"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-amber-400 px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
        >
          {/* Brillo que cruza el botón al pasar por encima. */}
          <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-12 bg-white/35 transition-all duration-700 ease-out group-hover:left-[150%]" />
          <LogIn size={13} className={pending ? "animate-pulse" : ""} />
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>

      {error && (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-center text-[11px] text-rose-200">
          {error}
        </p>
      )}
    </div>
  );
}
