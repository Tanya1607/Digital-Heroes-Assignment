"use client";

import { useActionState, useState } from "react";
import { signupAction } from "../actions";

type Charity = { id: string; name: string; tagline: string | null };

export function SignupForm({ charities }: { charities: Charity[] }) {
  const [state, action, pending] = useActionState(signupAction, null);
  const [pct, setPct] = useState(10);

  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Full name</span>
        <input
          name="fullName"
          required
          className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 outline-none focus:border-primary"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 outline-none focus:border-primary"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 outline-none focus:border-primary"
        />
        <span className="text-xs text-muted-foreground">Min 8 characters.</span>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Your charity</span>
        <select
          name="charityId"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 outline-none focus:border-primary"
        >
          <option value="" disabled>
            Choose a cause…
          </option>
          {charities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.tagline ? ` — ${c.tagline}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">
          Contribution: {pct}% of your subscription
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
        <span className="text-xs text-muted-foreground">
          Minimum 10% goes to your chosen charity. You can increase it any time.
        </span>
      </label>
      {state?.error && <p className="text-sm text-accent">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium shadow-sm hover:opacity-95 transition disabled:opacity-50"
      >
        {pending ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}
