"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="mt-8 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
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
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 outline-none focus:border-primary"
        />
      </label>
      {state?.error && (
        <p className="text-sm text-accent">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium shadow-sm hover:opacity-95 transition disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
