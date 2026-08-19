"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { saveProfile, type ProfileFormState } from "./actions";
import type { StudentInstrument } from "@/lib/students";

interface InstrumentDraft {
  id: string;
  name: string;
  startedAt: string;
}

interface ProfileEditorProps {
  academySince: string;
  instruments: StudentInstrument[];
}

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const initialState: ProfileFormState = {
  ok: false,
  message: "",
};

export default function ProfileEditor({
  academySince,
  instruments,
}: ProfileEditorProps) {
  const [state, formAction, pending] = useActionState(
    saveProfile,
    initialState,
  );
  const [drafts, setDrafts] = useState<InstrumentDraft[]>(
    instruments.map((instrument) => ({
      id: instrument.id,
      name: instrument.name,
      startedAt: instrument.startedAt ?? "",
    })),
  );

  const serialized = useMemo(
    () =>
      JSON.stringify(
        drafts.map((draft) => ({
          name: draft.name,
          startedAt: draft.startedAt || null,
        })),
      ),
    [drafts],
  );

  const updateDraft = (
    id: string,
    field: "name" | "startedAt",
    value: string,
  ) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, [field]: value } : draft,
      ),
    );
  };

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
      <section className="rounded-3xl border border-white/10 bg-black/45 p-5">
        <label
          htmlFor="academySince"
          className="text-[9px] font-black uppercase tracking-[0.22em] text-white/40"
        >
          En la academia desde
        </label>
        <input
          id="academySince"
          name="academySince"
          type="date"
          defaultValue={academySince}
          className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none transition focus:border-amber-300/60"
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/45 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-amber-200">
            Instrumentos
          </h2>
          <button
            type="button"
            onClick={() =>
              setDrafts((current) => [
                ...current,
                { id: makeId(), name: "", startedAt: "" },
              ])
            }
            className="grid h-9 w-9 place-items-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-200 transition hover:bg-amber-300/20"
            title="Añadir instrumento"
          >
            <Plus size={16} />
          </button>
        </div>

        <input type="hidden" name="instruments" value={serialized} />

        {drafts.length ? (
          <div className="space-y-2">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="grid gap-2 rounded-2xl border border-white/5 bg-white/5 p-3 sm:grid-cols-[1fr_150px_36px]"
              >
                <input
                  value={draft.name}
                  onChange={(event) =>
                    updateDraft(draft.id, "name", event.target.value)
                  }
                  placeholder="Instrumento"
                  className="h-10 min-w-0 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-amber-300/60"
                />
                <input
                  value={draft.startedAt}
                  onChange={(event) =>
                    updateDraft(draft.id, "startedAt", event.target.value)
                  }
                  type="date"
                  className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none transition focus:border-amber-300/60"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDrafts((current) =>
                      current.filter((item) => item.id !== draft.id),
                    )
                  }
                  className="grid h-10 w-full place-items-center rounded-xl border border-red-300/15 bg-red-400/10 text-red-200 transition hover:bg-red-400/20"
                  title="Quitar instrumento"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/45">
            Añade tu primer instrumento.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p
            className={`text-xs ${
              state.message
                ? state.ok
                  ? "text-emerald-300"
                  : "text-red-200"
                : "text-white/35"
            }`}
          >
            {state.message || "Los cambios se guardan en tu perfil."}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-300 px-4 text-sm font-black text-black transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60"
          >
            <Save size={15} />
            {pending ? "Guardando" : "Guardar"}
          </button>
        </div>
      </section>
    </form>
  );
}
