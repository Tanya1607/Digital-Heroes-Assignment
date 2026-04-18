import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: activeSubs },
    { count: charityCount },
    { data: donationsAgg },
    { data: latestDraw },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "trialing"]),
    supabase
      .from("charities")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase.from("donations").select("amount_minor"),
    supabase
      .from("draws")
      .select("id, period, status, pool_total_minor")
      .order("period", { ascending: false })
      .limit(1)
      .maybeSingle<{
        id: string;
        period: string;
        status: string;
        pool_total_minor: number;
      }>(),
  ]);

  const donationsTotal = (donationsAgg ?? []).reduce<number>(
    (a, r) => a + ((r as { amount_minor: number }).amount_minor ?? 0),
    0,
  );

  const stats = [
    { label: "Total users", value: String(userCount ?? 0) },
    { label: "Active subscribers", value: String(activeSubs ?? 0) },
    { label: "Charities listed", value: String(charityCount ?? 0) },
    { label: "Lifetime charity donations", value: formatMoney(donationsTotal) },
    {
      label: "Latest draw",
      value: latestDraw
        ? `${latestDraw.period} · ${latestDraw.status}`
        : "—",
    },
    {
      label: "Latest draw pool",
      value: latestDraw ? formatMoney(latestDraw.pool_total_minor ?? 0) : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold">Admin overview</h1>
        <p className="mt-2 text-muted-foreground">
          High-level platform health. Drill into each section from the tabs above.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-2 text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
