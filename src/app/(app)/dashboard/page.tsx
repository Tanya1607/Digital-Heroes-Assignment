import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth-helpers";
import { formatMoney } from "@/lib/utils";
import { SubscriptionGate } from "@/components/subscription-gate";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.hasActiveSubscription) {
    return (
      <SubscriptionGate message="Subscribe to activate score entry, monthly draws, and charity contributions." />
    );
  }

  const supabase = await createClient();
  const [
    { data: sub },
    { data: scores },
    { data: nextDraw },
    { count: winningsCount },
    { data: donationsAgg },
    { data: charity },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, cancel_at_period_end")
      .eq("user_id", session.userId!)
      .in("status", ["active", "trialing"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle<{
        plan: string;
        status: string;
        current_period_end: string | null;
        cancel_at_period_end: boolean;
      }>(),
    supabase
      .from("scores")
      .select("id, value, played_on")
      .order("played_on", { ascending: false })
      .limit(5),
    supabase
      .from("draws")
      .select("period, status")
      .in("status", ["draft", "simulated"])
      .order("period", { ascending: true })
      .limit(1)
      .maybeSingle<{ period: string; status: string }>(),
    supabase
      .from("winners")
      .select("id", { count: "exact", head: true }),
    supabase.from("donations").select("amount_minor").eq("user_id", session.userId!),
    (session.profile?.charity_id
      ? supabase
          .from("charities")
          .select("name, slug")
          .eq("id", session.profile.charity_id)
          .maybeSingle<{ name: string; slug: string }>()
      : Promise.resolve({ data: null as { name: string; slug: string } | null })) as Promise<{
      data: { name: string; slug: string } | null;
    }>,
  ]);

  const donationsTotal = (donationsAgg ?? []).reduce<number>(
    (a, r) => a + ((r as { amount_minor: number }).amount_minor ?? 0),
    0,
  );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold">
          Welcome back{session.profile?.full_name ? `, ${session.profile.full_name.split(" ")[0]}` : ""}.
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Subscription">
          {sub ? (
            <>
              <div className="text-xl font-semibold capitalize">{sub.plan}</div>
              <div className="text-sm text-muted-foreground">
                {sub.status}
                {sub.current_period_end &&
                  ` · renews ${format(new Date(sub.current_period_end), "d MMM")}`}
                {sub.cancel_at_period_end && " · cancels at period end"}
              </div>
              <ManageSubscription />
            </>
          ) : (
            <Link href="/pricing" className="text-primary">Subscribe →</Link>
          )}
        </Card>

        <Card title="Your charity">
          {charity ? (
            <>
              <div className="text-xl font-semibold">{charity.name}</div>
              <div className="text-sm text-muted-foreground">
                {session.profile?.charity_pct}% of each payment
              </div>
              <Link href="/charity" className="mt-3 inline-block text-primary text-sm">
                Change
              </Link>
            </>
          ) : (
            <Link href="/charity" className="text-primary">Choose charity →</Link>
          )}
        </Card>

        <Card title="Lifetime donated">
          <div className="text-xl font-semibold">{formatMoney(donationsTotal)}</div>
          <div className="text-sm text-muted-foreground">
            {(donationsAgg ?? []).length} contribution
            {(donationsAgg ?? []).length === 1 ? "" : "s"}
          </div>
        </Card>

        <Card title="Next draw">
          {nextDraw ? (
            <>
              <div className="text-xl font-semibold">{nextDraw.period}</div>
              <div className="text-sm text-muted-foreground">
                Status: {nextDraw.status}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              No draw scheduled yet.
            </div>
          )}
        </Card>

        <Card title="Your wins">
          <div className="text-xl font-semibold">{winningsCount ?? 0}</div>
          <Link href="/winnings" className="mt-3 inline-block text-primary text-sm">
            View details
          </Link>
        </Card>

        <Card title="Latest scores">
          {(scores ?? []).length === 0 ? (
            <Link href="/scores" className="text-primary">Log your first score →</Link>
          ) : (
            <ul className="mt-1 space-y-1 text-sm">
              {(scores as { id: string; value: number; played_on: string }[] ?? []).map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {format(new Date(s.played_on), "d MMM")}
                  </span>
                  <span className="font-medium">{s.value}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ManageSubscription() {
  return (
    <Link href="/account" className="mt-3 inline-block text-sm text-primary">
      Manage in account →
    </Link>
  );
}
