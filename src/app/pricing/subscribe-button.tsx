"use client";

import { useTransition } from "react";

export function SubscribeButton({
  plan,
  label,
}: {
  plan: "monthly" | "yearly";
  label: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ plan }),
          });
          const json = await res.json();
          if (json.url) window.location.href = json.url;
          else alert(json.error ?? "Could not start checkout.");
        })
      }
      className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium shadow-sm hover:opacity-95 disabled:opacity-50"
    >
      {pending ? "Redirecting…" : label}
    </button>
  );
}
