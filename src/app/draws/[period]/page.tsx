import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

type DrawRow = {
  id: string;
  period: string;
  winning_numbers: number[] | null;
  pool_total_minor: number;
  pool_5_minor: number;
  pool_4_minor: number;
  pool_3_minor: number;
  jackpot_rollover_in_minor: number;
  published_at: string | null;
};

type WinnerRow = {
  id: string;
  prize_amount_minor: number;
  currency: string;
  entry: { tier: number | null } | null;
};

export default async function PublicDrawPage({
  params,
}: {
  params: Promise<{ period: string }>;
}) {
  const { period } = await params;
  const supabase = await createClient();

  const { data: draw } = await supabase
    .from("draws")
    .select("id, period, winning_numbers, pool_total_minor, pool_5_minor, pool_4_minor, pool_3_minor, jackpot_rollover_in_minor, published_at")
    .eq("period", period)
    .eq("status", "published")
    .maybeSingle<DrawRow>();
  if (!draw) notFound();

  const { data: winnersRaw } = await supabase
    .from("winners")
    .select("id, prize_amount_minor, currency, entry:draw_entries!inner(tier)")
    .eq("entry.draw_id", draw.id);
  const winners = (winnersRaw ?? []) as unknown as WinnerRow[];

  const byTier = { 5: [] as WinnerRow[], 4: [] as WinnerRow[], 3: [] as WinnerRow[] };
  winners.forEach((w) => {
    const t = w.entry?.tier;
    if (t === 5 || t === 4 || t === 3) byTier[t].push(w);
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Draw</p>
      <h1 className="mt-1 text-5xl font-semibold">{draw.period}</h1>

      <section className="mt-10 rounded-3xl border border-border bg-card p-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground">
          Winning numbers
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {(draw.winning_numbers ?? []).map((n, i) => (
            <div
              key={i}
              className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold"
            >
              {n}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <TierCard
          title="5-number match"
          pool={draw.pool_5_minor + draw.jackpot_rollover_in_minor}
          count={byTier[5].length}
        />
        <TierCard title="4-number match" pool={draw.pool_4_minor} count={byTier[4].length} />
        <TierCard title="3-number match" pool={draw.pool_3_minor} count={byTier[3].length} />
      </section>

      <section className="mt-10 text-sm text-muted-foreground">
        Total pool: <span className="font-medium text-foreground">{formatMoney(draw.pool_total_minor)}</span>
        {draw.jackpot_rollover_in_minor > 0 && (
          <>
            {" · "}
            <span>Rolled in: {formatMoney(draw.jackpot_rollover_in_minor)}</span>
          </>
        )}
      </section>
    </main>
  );
}

function TierCard({
  title,
  pool,
  count,
}: {
  title: string;
  pool: number;
  count: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-1 text-2xl font-semibold">{formatMoney(pool)}</div>
      <div className="mt-3 text-sm text-muted-foreground">
        {count === 0
          ? "No winners — rolls over."
          : `${count} winner${count > 1 ? "s" : ""} · ${formatMoney(
              count === 0 ? 0 : Math.floor(pool / count),
            )} each`}
      </div>
    </div>
  );
}
