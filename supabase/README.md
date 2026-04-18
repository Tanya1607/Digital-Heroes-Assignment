# Supabase · Schema & Seed

## Applying to a new Supabase project

From a fresh Supabase project (required by the PRD — do not reuse an existing one):

```bash
# With the Supabase CLI, from this `supabase/` directory:
supabase link --project-ref <your-ref>
supabase db push
```

Or paste each migration and seed file into the **SQL Editor** in Supabase Studio, in order:

1. `migrations/20260418000001_initial_schema.sql` — tables, constraints, RLS, triggers
2. `migrations/20260418000002_draw_engine.sql` — draw algorithms, pool math, storage policies
3. `seed/01_charities.sql` — sample charity directory

## Promoting the first admin

After signing up via the app UI, run this once in the SQL Editor (replace the email):

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## What is enforced at the DB layer

- **Score range 1–45** — `scores.value` CHECK
- **One score per date** — `UNIQUE(user_id, played_on)`
- **Rolling 5 scores** — `scores_rolling_five` trigger prunes older rows on insert
- **Charity % ≥ 10** — `profiles.charity_pct` CHECK
- **Pool split sums to 100** — `platform_config` CHECK
- **Winning numbers: 5 values, each 1–45** — `draws.winning_numbers` CHECK
- **Payout only after verification approved** — `winners` CHECK
- **Row-level security** — every public table; `is_admin()` helper

## Regenerate TypeScript types

After any schema change:

```bash
npx supabase gen types typescript --project-id <your-ref> --schema public > src/types/database.ts
```
