"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** "Tengo un código": se escribe o se pega y lleva al examen. */
export default function CodeJump() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const code = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (code.length === 12) router.push(`/e/${code}`);
      }}
      className="flex gap-2"
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Código de 12 caracteres"
        aria-label="Código del examen"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 font-mono text-sm uppercase tracking-[0.1em] text-white outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-white/30 focus:border-amber-300/60"
      />
      <button
        type="submit"
        disabled={code.length !== 12}
        className="rounded-xl bg-white/10 px-4 text-xs font-black uppercase tracking-[0.15em] text-white transition hover:bg-white/15 disabled:opacity-40"
      >
        Ir
      </button>
    </form>
  );
}
