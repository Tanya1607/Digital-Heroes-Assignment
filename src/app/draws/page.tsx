import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

type DrawListRow = {
  id: string;
  period: string;
  winning_numbers: number[] | null;
  pool_total_minor: number;
};

export default async function PublicDrawsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("draws")
    .select("id, period, winning_numbers, pool_total_minor")
    .eq("status", "published")
    .order("period", { ascending: false });
  const draws = (data ?? []) as DrawListRow[];

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-5xl font-semibold">Monthly draws</h1>
      <p className="mt-2 text-muted-foreground">
        Every published draw, ever. Transparent and final once posted.
      </p>

      <div className="mt-10 space-y-4">
        {draws.map((d) => (
          <Link
            key={d.id}
            href={`/draws/${d.period}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 hover:border-primary transition"
          >
            <div>
              <div className="font-medium">{d.period}</div>
              <div className="mt-2 flex gap-2 font-mono">
                {(d.winning_numbers ?? []).map((n, i) => (
                  <span
                    key={i}
                    className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Total pool</div>
              <div className="font-semibold">{formatMoney(d.pool_total_minor)}</div>
            </div>
          </Link>
        ))}
        {draws.length === 0 && (
          <p className="text-muted-foreground">No published draws yet.</p>
        )}
      </div>
    </main>
  );
}
