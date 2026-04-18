import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import { ProofUploader } from "./proof-uploader";

type WinningRow = {
  id: string;
  prize_amount_minor: number;
  currency: string;
  verification: "pending" | "approved" | "rejected";
  payout_status: "pending" | "paid";
  proof_url: string | null;
  rejection_reason: string | null;
  draw_entry: {
    tier: number | null;
    draw: { period: string; winning_numbers: number[] | null } | null;
  } | null;
};

export default async function WinningsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("winners")
    .select(`
      id, prize_amount_minor, currency, verification, payout_status, proof_url, rejection_reason,
      draw_entry:draw_entries!inner (
        tier,
        draw:draws (period, winning_numbers)
      )
    `)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as WinningRow[];
  const totalWon = rows
    .filter((r) => r.payout_status === "paid")
    .reduce((a, r) => a + r.prize_amount_minor, 0);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold">Your winnings</h1>
        <p className="mt-2 text-muted-foreground">
          Upload proof for any pending prize. We&apos;ll verify and mark it paid.
        </p>
      </header>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Total paid out to you
        </div>
        <div className="mt-1 text-3xl font-semibold">{formatMoney(totalWon)}</div>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          No wins yet. Keep your scores current and wait for the next draw.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((w) => (
            <li
              key={w.id}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {w.draw_entry?.draw?.period ?? "—"} · {w.draw_entry?.tier}-match
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {formatMoney(w.prize_amount_minor, w.currency)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <StatusPill label={w.verification} tone="verification" />
                  <StatusPill label={w.payout_status} tone="payout" />
                </div>
              </div>
              {w.rejection_reason && (
                <p className="mt-3 rounded-md bg-accent/10 p-3 text-sm text-accent">
                  Rejected: {w.rejection_reason}
                </p>
              )}
              {w.verification === "pending" && (
                <div className="mt-4">
                  <ProofUploader winnerId={w.id} hasProof={!!w.proof_url} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "verification" | "payout";
}) {
  const pendingColor =
    tone === "verification"
      ? "bg-muted text-muted-foreground"
      : "bg-muted text-muted-foreground";
  const map: Record<string, string> = {
    pending: pendingColor,
    approved: "bg-primary/10 text-primary",
    rejected: "bg-accent/10 text-accent",
    paid: "bg-primary/10 text-primary",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[label] ?? "bg-muted"}`}
    >
      {label}
    </span>
  );
}
