"use client";

import { useActionState } from "react";
import { addScoreAction } from "./actions";

export function AddScoreForm() {
  const [state, action, pending] = useActionState(addScoreAction, null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={action}
      className="rounded-2xl border border-border bg-card p-6 space-y-4"
    >
      <h2 className="text-lg font-semibold">Log a round</h2>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] items-end">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Score
          </span>
          <input
            name="value"
            type="number"
            min={1}
            max={45}
            required
            className="mt-1 w-24 rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Date played
          </span>
          <input
            name="playedOn"
            type="date"
            required
            defaultValue={today}
            max={today}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <button
          disabled={pending}
          className="rounded-full bg-primary px-6 py-2.5 text-primary-foreground font-medium disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add score"}
        </button>
      </div>
      {state && "error" in state && state.error && (
        <p className="text-sm text-accent">{state.error}</p>
      )}
      {state && "ok" in state && state.ok && (
        <p className="text-sm text-primary">Score recorded.</p>
      )}
    </form>
  );
}
