"use client";

import { useActionState } from "react";
import { LogIn, Lock, User } from "lucide-react";
import { loginWithGoogle, loginWithPassword } from "./actions";

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.9 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.9c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.3-10.2 7.3-17.5z" />
    <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.3 0 20 0 24s.9 7.7 2.6 10.8l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

export default function LoginForm({ googleError }: { googleError?: string }) {
  const [passwordError, formAction, pending] = useActionState(loginWithPassword, null);
  const error = passwordError || googleError;

  return (
    <div className="space-y-3.5">
      <form action={loginWithGoogle}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-[13px] font-black text-slate-900 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <GoogleMark />
          Entrar con Google
        </button>
      </form>

      <div className="flex items-center gap-2.5">
        <span className="h-px flex-1 bg-white/15" />
        <span className="text-[8px] font-black uppercase tracking-[0.28em] text-white/40">
          o con tu usuario
        </span>
        <span className="h-px flex-1 bg-white/15" />
      </div>

      <form action={formAction} className="space-y-2">
        <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-amber-300/60">
          <User size={14} className="text-amber-300/80" />
          <input
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="Usuario"
            className="w-full bg-transparent text-[13px] text-white placeholder:text-white/35 focus:outline-none"
          />
        </label>

        <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 focus-within:border-amber-300/60">
          <Lock size={14} className="text-amber-300/80" />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Contraseña"
            className="w-full bg-transparent text-[13px] text-white placeholder:text-white/35 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
        >
          <LogIn size={13} />
          {pending ? "Entrando..." : "Entrar"}
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
