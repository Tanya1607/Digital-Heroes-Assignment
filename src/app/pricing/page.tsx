import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SubscribeButton } from "./subscribe-button";

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const plans = [
    {
      id: "monthly",
      price: "£10",
      cadence: "per month",
      tagline: "Try a month, cancel any time.",
      cta: "Start monthly",
    },
    {
      id: "yearly",
      price: "£99",
      cadence: "per year",
      tagline: "Save ~17% vs monthly.",
      cta: "Go yearly",
      highlight: true,
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
          Subscribe
        </p>
        <h1 className="mt-3 text-5xl font-semibold">Fair pricing, big impact.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          50% of every subscription fuels the monthly prize pool, 10%+ goes
          straight to your chosen charity, the rest keeps the lights on.
        </p>
      </header>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl border p-8 transition ${
              p.highlight
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-semibold">{p.price}</span>
              <span className="text-muted-foreground">{p.cadence}</span>
            </div>
            <p className="mt-3 text-muted-foreground">{p.tagline}</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ Monthly draw entry</li>
              <li>✓ 5-number match jackpot eligibility</li>
              <li>✓ Charity contribution</li>
              <li>✓ Full dashboard access</li>
            </ul>
            <div className="mt-8">
              {user ? (
                <SubscribeButton plan={p.id as "monthly" | "yearly"} label={p.cta} />
              ) : (
                <Link
                  href={`/signup`}
                  className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-accent-foreground font-medium"
                >
                  Create account to subscribe
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
