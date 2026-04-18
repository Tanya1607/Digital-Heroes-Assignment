"use client";

import { useActionState, useState } from "react";
import { updateCharityAction } from "./actions";

type CharityOpt = { id: string; name: string };

export function CharityForm({
  charities,
  currentCharityId,
  currentPct,
}: {
  charities: CharityOpt[];
  currentCharityId: string;
  currentPct: number;
}) {
  const [state, action, pending] = useActionState(updateCharityAction, null);
  const [pct, setPct] = useState(currentPct);

  return (
    <form
      action={action}
      className="rounded-2xl border border-border bg-card p-6 space-y-4"
    >
      <label className="block">
        <span className="text-sm font-medium">Charity</span>
        <select
          name="charityId"
          defaultValue={currentCharityId}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5"
        >
          <option value="" disabled>Choose…</option>
          {charities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">
          Contribution: {pct}% of each payment
        </span>
        <input
          name="charityPct"
          type="range"
          min={10}
          max={100}
          step={5}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="mt-2 w-full accent-[rgb(var(--primary))]"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-full bg-primary px-5 py-2 text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {state?.ok && <span className="text-sm text-primary">Saved.</span>}
        {state?.error && <span className="text-sm text-accent">{state.error}</span>}
      </div>
    </form>
  );
}
