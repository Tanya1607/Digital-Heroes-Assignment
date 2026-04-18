import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import {
  approveWinnerAction,
  rejectWinnerAction,
  markPaidAction,
  signedProofUrl,
} from "./actions";

type WinnerAdminRow = {
  id: string;
  prize_amount_minor: number;
  currency: string;
  verification: "pending" | "approved" | "rejected";
  payout_status: "pending" | "paid";
  proof_url: string | null;
  rejection_reason: string | null;
  draw_entry: {
    tier: number | null;
    user: { id: string; email: string; full_name: string | null } | null;
    draw: { period: string } | null;
  } | null;
};

export default async function AdminWinnersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("winners")
    .select(`
      id, prize_amount_minor, currency, verification, payout_status, proof_url, rejection_reason,
      draw_entry:draw_entries!inner (
        tier,
        user:profiles!inner (id, email, full_name),
        draw:draws (period)
      )
    `)
    .order("created_at", { ascending: false });
  if (filter === "pending") query = query.eq("verification", "pending");
  if (filter === "to_pay")
    query = query.eq("verification", "approved").eq("payout_status", "pending");

  const { data } = await query;
  const rows = (data ?? []) as unknown as WinnerAdminRow[];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Winners</h1>
          <p className="mt-2 text-muted-foreground">
            Review proof uploads, approve or reject, then mark paid.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <FilterLink label="All" value="" current={filter} />
          <FilterLink label="Pending review" value="pending" current={filter} />
          <FilterLink label="To pay" value="to_pay" current={filter} />
        </div>
      </header>

      <div className="space-y-4">
        {await Promise.all(rows.map((w) => renderRow(w)))}
        {rows.length === 0 && (
          <p className="text-muted-foreground">No winners match this filter.</p>
        )}
      </div>
    </div>
  );
}

async function renderRow(w: WinnerAdminRow) {
  const proofLink = w.proof_url ? await signedProofUrl(w.proof_url) : null;

  return (
    <div key={w.id} className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            {w.draw_entry?.draw?.period ?? "—"} · {w.draw_entry?.tier}-match
          </div>
          <div className="mt-1 font-medium">
            {w.draw_entry?.user?.full_name ?? w.draw_entry?.user?.email}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">
            {formatMoney(w.prize_amount_minor, w.currency)}
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
              {w.verification}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
              {w.payout_status}
            </span>
          </div>
        </div>
      </div>

      {proofLink && (
        <a
          href={proofLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          View proof →
        </a>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {w.verification === "pending" && (
          <>
            <form action={approveWinnerAction}>
              <input type="hidden" name="id" value={w.id} />
              <button className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground text-sm">
                Approve
              </button>
            </form>
            <form action={rejectWinnerAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={w.id} />
              <input
                name="reason"
                placeholder="Rejection reason"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
              <button className="rounded-full border border-accent px-4 py-1.5 text-accent text-sm">
                Reject
              </button>
            </form>
          </>
        )}
        {w.verification === "approved" && w.payout_status === "pending" && (
          <form action={markPaidAction}>
            <input type="hidden" name="id" value={w.id} />
            <button className="rounded-full bg-accent px-4 py-1.5 text-accent-foreground text-sm">
              Mark paid
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function FilterLink({
  label,
  value,
  current,
}: {
  label: string;
  value: string;
  current?: string;
}) {
  const active = (current ?? "") === value;
  return (
    <a
      href={value ? `?filter=${value}` : "?"}
      className={`rounded-full px-3 py-1 ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      {label}
    </a>
  );
}
