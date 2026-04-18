import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import { createDrawAction } from "./actions";

type DrawRow = {
  id: string;
  period: string;
  mode: string;
  weighting: string | null;
  status: string;
  winning_numbers: number[] | null;
  pool_total_minor: number;
  jackpot_rollover_in_minor: number;
};

export default async function AdminDrawsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("draws")
    .select("id, period, mode, weighting, status, winning_numbers, pool_total_minor, jackpot_rollover_in_minor")
    .order("period", { ascending: false });
  const draws = (data ?? []) as DrawRow[];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Draws</h1>
          <p className="mt-2 text-muted-foreground">
            Monthly cadence. Create → configure → generate → simulate → publish.
          </p>
        </div>
        <form action={createDrawAction}>
          <button className="rounded-full bg-accent px-5 py-2.5 text-accent-foreground text-sm font-medium">
            Create draw for this month
          </button>
        </form>
      </header>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Period</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Mode</th>
              <th className="px-4 py-3 text-left">Numbers</th>
              <th className="px-4 py-3 text-right">Pool</th>
              <th className="px-4 py-3 text-right">Rollover in</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {draws.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{d.period}</td>
                <td className="px-4 py-3">
                  <StatusPill status={d.status} />
                </td>
                <td className="px-4 py-3">
                  {d.mode}
                  {d.weighting ? ` · ${d.weighting}` : ""}
                </td>
                <td className="px-4 py-3 font-mono">
                  {d.winning_numbers ? d.winning_numbers.join("  ") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(d.pool_total_minor)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(d.jackpot_rollover_in_minor)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/draws/${d.id}`}
                    className="text-primary hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {draws.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No draws yet. Create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    simulated: "bg-primary/10 text-primary",
    published: "bg-accent/10 text-accent",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}
    >
      {status}
    </span>
  );
}
