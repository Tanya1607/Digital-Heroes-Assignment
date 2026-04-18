import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import {
  configureDrawAction,
  generateNumbersAction,
  simulateDrawAction,
  publishDrawAction,
} from "../actions";

type DrawFull = {
  id: string;
  period: string;
  mode: "random" | "algorithmic";
  weighting: "most_frequent" | "least_frequent" | null;
  status: "draft" | "simulated" | "published";
  winning_numbers: number[] | null;
  pool_total_minor: number;
  pool_5_minor: number;
  pool_4_minor: number;
  pool_3_minor: number;
  jackpot_rollover_in_minor: number;
  jackpot_rollover_out_minor: number;
};

type TierRow = { tier: number | null; count: number };

export default async function AdminDrawDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: draw } = await supabase
    .from("draws")
    .select("id, period, mode, weighting, status, winning_numbers, pool_total_minor, pool_5_minor, pool_4_minor, pool_3_minor, jackpot_rollover_in_minor, jackpot_rollover_out_minor")
    .eq("id", id)
    .maybeSingle<DrawFull>();
  if (!draw) notFound();

  const { data: entries } = await supabase
    .from("draw_entries")
    .select("tier")
    .eq("draw_id", id);
  const tiers: Record<string, number> = { "5": 0, "4": 0, "3": 0, none: 0 };
  ((entries ?? []) as TierRow[]).forEach((r) => {
    const key = r.tier ? String(r.tier) : "none";
    tiers[key] = (tiers[key] ?? 0) + 1;
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold">Draw · {draw.period}</h1>
        <p className="mt-2 text-muted-foreground">
          Status: <span className="font-medium text-foreground">{draw.status}</span>
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card label="Total pool" value={formatMoney(draw.pool_total_minor)} />
        <Card label="5-match pot (+ rollover)" value={formatMoney(draw.pool_5_minor + draw.jackpot_rollover_in_minor)} />
        <Card label="4-match pot" value={formatMoney(draw.pool_4_minor)} />
        <Card label="3-match pot" value={formatMoney(draw.pool_3_minor)} />
        <Card label="Rollover coming in" value={formatMoney(draw.jackpot_rollover_in_minor)} />
        <Card label="Rollover going out" value={formatMoney(draw.jackpot_rollover_out_minor)} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Configure</h2>
        <form action={configureDrawAction} className="flex flex-wrap items-end gap-4">
          <input type="hidden" name="drawId" value={draw.id} />
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Mode</span>
            <select
              name="mode"
              defaultValue={draw.mode}
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="random">Random</option>
              <option value="algorithmic">Algorithmic</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Weighting</span>
            <select
              name="weighting"
              defaultValue={draw.weighting ?? ""}
              className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">— (random)</option>
              <option value="most_frequent">Most-frequent scores</option>
              <option value="least_frequent">Least-frequent scores</option>
            </select>
          </label>
          <button className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">
            Save config
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Winning numbers</h2>
        <div className="flex flex-wrap gap-3">
          {(draw.winning_numbers ?? [null, null, null, null, null]).map((n, i) => (
            <div
              key={i}
              className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground font-semibold"
            >
              {n ?? "·"}
            </div>
          ))}
        </div>
        <form action={generateNumbersAction}>
          <input type="hidden" name="drawId" value={draw.id} />
          <button
            disabled={draw.status === "published"}
            className="rounded-full bg-primary px-5 py-2 text-primary-foreground text-sm font-medium disabled:opacity-40"
          >
            Generate numbers
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Simulation</h2>
        <div className="grid gap-2 sm:grid-cols-4 text-sm">
          <Tier label="5-match winners" count={tiers["5"] ?? 0} />
          <Tier label="4-match winners" count={tiers["4"] ?? 0} />
          <Tier label="3-match winners" count={tiers["3"] ?? 0} />
          <Tier label="No match" count={tiers.none ?? 0} />
        </div>
        <div className="flex gap-3">
          <form action={simulateDrawAction}>
            <input type="hidden" name="drawId" value={draw.id} />
            <button
              disabled={!draw.winning_numbers || draw.status === "published"}
              className="rounded-full border border-border px-5 py-2 text-sm hover:bg-muted disabled:opacity-40"
            >
              Run simulation
            </button>
          </form>
          <form action={publishDrawAction}>
            <input type="hidden" name="drawId" value={draw.id} />
            <button
              disabled={draw.status !== "simulated"}
              className="rounded-full bg-accent px-5 py-2 text-accent-foreground text-sm font-medium disabled:opacity-40"
            >
              Publish results
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Tier({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{count}</div>
    </div>
  );
}
