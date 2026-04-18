import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import {
  adminEditScoreAction,
  adminDeleteScoreAction,
  adminSetRoleAction,
} from "./actions";

type UserFull = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  charity_pct: number;
  created_at: string;
  charity: { name: string } | null;
};

type Score = { id: string; value: number; played_on: string };
type Sub = {
  id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, charity_pct, created_at, charity:charities(name)")
    .eq("id", id)
    .maybeSingle();
  if (!user) notFound();
  const u = user as unknown as UserFull;

  const { data: scores } = await supabase
    .from("scores")
    .select("id, value, played_on")
    .eq("user_id", id)
    .order("played_on", { ascending: false });
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("id, plan, status, current_period_end")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  const { data: donations } = await supabase
    .from("donations")
    .select("amount_minor")
    .eq("user_id", id);

  const totalDonated = (donations ?? []).reduce<number>(
    (a, r) => a + ((r as { amount_minor: number }).amount_minor ?? 0),
    0,
  );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold">{u.full_name ?? u.email}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {u.email} · joined {format(new Date(u.created_at), "d MMM yyyy")}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card label="Role">
          <form action={adminSetRoleAction} className="flex gap-2">
            <input type="hidden" name="userId" value={u.id} />
            <select
              name="role"
              defaultValue={u.role}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted">
              Save
            </button>
          </form>
        </Card>
        <Card label="Charity">
          <div className="text-lg font-semibold">{u.charity?.name ?? "—"}</div>
          <div className="text-sm text-muted-foreground">{u.charity_pct}%</div>
        </Card>
        <Card label="Lifetime donated">
          <div className="text-lg font-semibold">{formatMoney(totalDonated)}</div>
        </Card>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Subscriptions
        </h2>
        <div className="mt-3 space-y-2">
          {(subs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">None.</p>
          ) : (
            (subs as Sub[]).map((s) => (
              <div
                key={s.id}
                className="flex justify-between rounded-lg border border-border bg-card p-3 text-sm"
              >
                <span className="capitalize">{s.plan}</span>
                <span className="text-muted-foreground">{s.status}</span>
                <span>
                  {s.current_period_end
                    ? format(new Date(s.current_period_end), "d MMM yyyy")
                    : "—"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Scores ({(scores ?? []).length})
        </h2>
        <ul className="mt-3 space-y-2">
          {((scores ?? []) as Score[]).map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm"
            >
              <span className="text-muted-foreground w-24">
                {format(new Date(s.played_on), "d MMM yyyy")}
              </span>
              <form action={adminEditScoreAction} className="flex gap-2">
                <input type="hidden" name="id" value={s.id} />
                <input
                  name="value"
                  type="number"
                  min={1}
                  max={45}
                  defaultValue={s.value}
                  className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
                />
                <button className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted">
                  Save
                </button>
              </form>
              <form action={adminDeleteScoreAction} className="ml-auto">
                <input type="hidden" name="id" value={s.id} />
                <button className="text-xs text-accent">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
