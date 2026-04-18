import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth-helpers";
import { AddScoreForm } from "./add-score-form";
import { deleteScoreAction, editScoreAction } from "./actions";
import { SubscriptionGate } from "@/components/subscription-gate";

type ScoreRow = { id: string; value: number; played_on: string };

export default async function ScoresPage() {
  const session = await getSession();
  if (!session.hasActiveSubscription) {
    return <SubscriptionGate message="Subscribe to enter your scores and join the monthly draw." />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("scores")
    .select("id, value, played_on")
    .order("played_on", { ascending: false })
    .limit(5);
  const scores = (data ?? []) as ScoreRow[];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold">Your last five scores</h1>
        <p className="mt-2 text-muted-foreground">
          Stableford format, 1–45. Only one score per date. A new entry pushes
          the oldest out.
        </p>
      </header>

      <AddScoreForm />

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Most recent first
        </h2>
        {scores.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            No scores yet. Log your latest round above.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {scores.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <span className="w-20 text-2xl font-semibold">{s.value}</span>
                <span className="text-muted-foreground text-sm flex-1">
                  {format(new Date(s.played_on), "EEE d MMM yyyy")}
                </span>
                <form action={editScoreAction} className="flex items-center gap-2">
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
                <form action={deleteScoreAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="rounded-full px-3 py-1 text-xs text-accent hover:bg-accent/10">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
