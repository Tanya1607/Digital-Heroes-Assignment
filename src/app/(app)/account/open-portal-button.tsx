"use client";

import { useTransition } from "react";

export function OpenPortalButton() {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await fetch("/api/stripe/portal", { method: "POST" });
          const json = await res.json();
          if (json.url) window.location.href = json.url;
          else alert(json.error ?? "Could not open portal.");
        })
      }
      className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Opening…" : "Manage in Stripe portal"}
    </button>
  );
}
