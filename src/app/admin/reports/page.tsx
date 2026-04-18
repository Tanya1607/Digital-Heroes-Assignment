import { createClient } from "@/lib/supabase/server";
import { ReportsCharts } from "./reports-charts";
import { formatMoney } from "@/lib/utils";

type MonthlyDonation = { period_month: string | null; amount_minor: number };
type DrawStat = {
  period: string;
  pool_total_minor: number;
  status: string;
};
type CharityBucket = {
  amount_minor: number;
  charity: { name: string } | null;
};

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const [
    { data: donations },
    { data: draws },
    { data: byCharity },
  ] = await Promise.all([
    supabase
      .from("donations")
      .select("period_month, amount_minor")
      .not("period_month", "is", null)
      .order("period_month"),
    supabase
      .from("draws")
      .select("period, pool_total_minor, status")
      .eq("status", "published")
      .order("period"),
    supabase
      .from("donations")
      .select("amount_minor, charity:charities(name)"),
  ]);

  // Aggregate donations by month.
  const monthlyMap = new Map<string, number>();
  ((donations ?? []) as MonthlyDonation[]).forEach((r) => {
    if (!r.period_month) return;
    monthlyMap.set(
      r.period_month,
      (monthlyMap.get(r.period_month) ?? 0) + r.amount_minor,
    );
  });
  const monthlySeries = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month: month.slice(0, 7),
      amount: amount / 100,
    }));

  const poolSeries = ((draws ?? []) as DrawStat[]).map((d) => ({
    period: d.period,
    pool: d.pool_total_minor / 100,
  }));

  const charityMap = new Map<string, number>();
  ((byCharity ?? []) as unknown as CharityBucket[]).forEach((r) => {
    const name = r.charity?.name ?? "Unknown";
    charityMap.set(name, (charityMap.get(name) ?? 0) + r.amount_minor);
  });
  const charitySeries = [...charityMap.entries()]
    .map(([name, amount]) => ({ name, amount: amount / 100 }))
    .sort((a, b) => b.amount - a.amount);

  const grandTotal = [...charityMap.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold">Reports</h1>
        <p className="mt-2 text-muted-foreground">
          Monthly movement across donations, draw pools, and charities.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Lifetime charity contributions
        </div>
        <div className="mt-1 text-3xl font-semibold">
          {formatMoney(grandTotal)}
        </div>
      </div>

      <ReportsCharts
        monthlySeries={monthlySeries}
        poolSeries={poolSeries}
        charitySeries={charitySeries}
      />
    </div>
  );
}
