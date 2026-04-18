import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth-helpers";
import { format } from "date-fns";
import { OpenPortalButton } from "./open-portal-button";
import { formatMoney } from "@/lib/utils";

type SubRow = {
  id: string;
  plan: string;
  status: string;
  price_amount_minor: number;
  currency: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export default async function AccountPage() {
  const session = await getSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("id, plan, status, price_amount_minor, currency, current_period_end, cancel_at_period_end")
    .eq("user_id", session.userId!)
    .order("created_at", { ascending: false });
  const subs = (data ?? []) as SubRow[];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold">Account</h1>
        <p className="mt-2 text-muted-foreground">{session.profile?.email}</p>
      </header>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Subscription history
        </h2>
        <div className="mt-4 space-y-3">
          {subs.length === 0 ? (
            <p className="text-muted-foreground">No subscription yet.</p>
          ) : (
            subs.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <div className="font-medium capitalize">{s.plan}</div>
                  <div className="text-sm text-muted-foreground">
                    {s.status}
                    {s.current_period_end &&
                      ` · next bill ${format(new Date(s.current_period_end), "d MMM yyyy")}`}
                    {s.cancel_at_period_end && " · cancels at period end"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatMoney(s.price_amount_minor, s.currency)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {subs.length > 0 && (
          <div className="mt-6">
            <OpenPortalButton />
          </div>
        )}
      </section>
    </div>
  );
}
