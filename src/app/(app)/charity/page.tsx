import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth-helpers";
import { CharityForm } from "./charity-form";
import { formatMoney } from "@/lib/utils";

type CharityOpt = { id: string; name: string };
type DonationRow = {
  id: string;
  amount_minor: number;
  currency: string;
  source: "subscription" | "independent";
  period_month: string | null;
  created_at: string;
  charity: { name: string } | null;
};

export default async function CharityPage() {
  const session = await getSession();
  const supabase = await createClient();

  const [{ data: charities }, { data: donations }] = await Promise.all([
    supabase
      .from("charities")
      .select("id, name")
      .eq("active", true)
      .order("name"),
    supabase
      .from("donations")
      .select("id, amount_minor, currency, source, period_month, created_at, charity:charities(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const total =
    (donations ?? []).reduce<number>(
      (sum, d) => sum + ((d as unknown as DonationRow).amount_minor ?? 0),
      0,
    );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold">Your charity</h1>
        <p className="mt-2 text-muted-foreground">
          Raise your contribution any time. The 10% minimum is always honoured.
        </p>
      </header>

      <CharityForm
        charities={(charities ?? []) as unknown as CharityOpt[]}
        currentCharityId={session.profile?.charity_id ?? ""}
        currentPct={session.profile?.charity_pct ?? 10}
      />

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Your contributions to date
        </h2>
        <div className="mt-4 rounded-2xl border border-border bg-card p-6">
          <p className="text-4xl font-semibold">{formatMoney(total)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Across {(donations ?? []).length} recorded contribution
            {(donations ?? []).length === 1 ? "" : "s"}.
          </p>
        </div>
        <ul className="mt-6 space-y-2">
          {((donations ?? []) as unknown as DonationRow[]).map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium">{d.charity?.name ?? "—"}</span>
              <span className="text-muted-foreground">
                {d.source === "subscription" ? "Subscription" : "One-off"}
              </span>
              <span className="font-medium">
                {formatMoney(d.amount_minor, d.currency)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
