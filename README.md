# GolfDraw

Subscription-driven web app combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine. Built for the Digital Heroes Full-Stack Trainee selection process against [`docs/PRD_Full_Stack_Training.pdf`](docs/PRD_Full_Stack_Training.pdf).

## Stack

- **Next.js 16** (App Router, React 19, TypeScript, Server Actions)
- **Supabase** (Postgres · Auth · Storage · RLS)
- **Stripe** (Checkout, Customer Portal, webhooks — test mode)
- **Resend + React Email** (welcome / draw results / winner alerts)
- **Tailwind v4** (CSS-first config via `@theme`) + **Framer Motion**
- **Recharts** for admin analytics
- **zod** for runtime validation (auth forms, score entry, RPC args)
- **Vercel Cron** for the monthly draw trigger

## Local development

```bash
cp .env.example .env.local
# then fill in all values — see "Required env vars" below
npm install
npm run dev
```

The app expects a freshly provisioned **Supabase project** and a **Stripe test account** (PRD §15: deploy to a new Vercel + new Supabase project — do not reuse personal ones).

### Apply the database

See [`supabase/README.md`](supabase/README.md). In short:

1. Run [`supabase/migrations/20260418000001_initial_schema.sql`](supabase/migrations/20260418000001_initial_schema.sql)
2. Run [`supabase/migrations/20260418000002_draw_engine.sql`](supabase/migrations/20260418000002_draw_engine.sql)
3. Run [`supabase/seed/01_charities.sql`](supabase/seed/01_charities.sql)
4. Promote your first admin: `update public.profiles set role = 'admin' where email = 'you@example.com';`

### Stripe webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the `whsec_…` shown and paste into STRIPE_WEBHOOK_SECRET
```

Create two test-mode recurring prices (monthly £10, yearly £99) and put their IDs in `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`.

## Required env vars

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public origin, no trailing slash |
| `NEXT_PUBLIC_APP_NAME` | `GolfDraw` |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | `GBP` |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only — never expose to browser |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_PRICE_MONTHLY` | Recurring price ID for monthly plan |
| `STRIPE_PRICE_YEARLY` | Recurring price ID for yearly plan |
| `RESEND_API_KEY` | Resend project key |
| `RESEND_FROM_EMAIL` | Verified sender |
| `CRON_SECRET` | Long random string; required on `/api/cron/*` calls |

## Deploy to Vercel

1. Push this repo to GitHub (already done)
2. Import into a **new Vercel account** (PRD §15)
3. Set **Root Directory** to `golfdraw/` if the Next.js app isn't at the repo root
4. Add all env vars above
5. Deploy. Vercel Cron picks up `vercel.json` automatically — it runs at 09:00 UTC on the 1st of each month, hitting [`/api/cron/run-monthly-draw`](src/app/api/cron/run-monthly-draw/route.ts)
6. Add the deployed `/api/stripe/webhook` URL to Stripe and paste the resulting secret into `STRIPE_WEBHOOK_SECRET`

## Key paths

| Area | Entry |
| --- | --- |
| Homepage | [src/app/page.tsx](src/app/page.tsx) |
| Auth | [src/app/(auth)/](src/app/(auth)/) |
| User dashboard | [src/app/(app)/dashboard/page.tsx](src/app/(app)/dashboard/page.tsx) |
| Scores | [src/app/(app)/scores/page.tsx](src/app/(app)/scores/page.tsx) |
| Charity (user) | [src/app/(app)/charity/page.tsx](src/app/(app)/charity/page.tsx) |
| Winnings + proof upload | [src/app/(app)/winnings/page.tsx](src/app/(app)/winnings/page.tsx) |
| Public charity directory | [src/app/charities/page.tsx](src/app/charities/page.tsx) |
| Public draws | [src/app/draws/page.tsx](src/app/draws/page.tsx) |
| Admin | [src/app/admin/](src/app/admin/) |
| Stripe webhook | [src/app/api/stripe/webhook/route.ts](src/app/api/stripe/webhook/route.ts) |
| Monthly cron | [src/app/api/cron/run-monthly-draw/route.ts](src/app/api/cron/run-monthly-draw/route.ts) |
| Proxy (auth, route gating) | [proxy.ts](proxy.ts) |
| DB schema | [supabase/migrations/](supabase/migrations/) |

## Data-handling invariants (enforced in the database)

These are all in the migration, not only in the app layer, so the app cannot violate PRD rules even if a future bug tried to:

- Stableford score range **1–45** — CHECK on `scores.value`
- **One score per date** per user — UNIQUE `(user_id, played_on)`
- **Rolling 5** — `scores_rolling_five` trigger prunes older rows on insert
- Charity contribution **≥ 10%** — CHECK on `profiles.charity_pct`
- Pool split sums to **100%** — CHECK on `platform_config`
- Winning numbers: **5 values, each 1–45** — CHECK on `draws.winning_numbers`
- **Payout only after verification approved** — CHECK on `winners`
- Row-level security on every public table; `is_admin()` helper

## PRD traceability

| PRD section | Implementation |
| --- | --- |
| §4 Subscription & Payment | [src/app/pricing/](src/app/pricing/) · [src/app/api/stripe/](src/app/api/stripe/) · [src/lib/auth-helpers.ts](src/lib/auth-helpers.ts) |
| §5 Score Management | [src/app/(app)/scores/](src/app/(app)/scores/) · `scores_rolling_five` trigger |
| §6 Draw & Reward | [src/app/admin/draws/](src/app/admin/draws/) · `run_draw`, `publish_draw` · [src/app/api/cron/](src/app/api/cron/) |
| §7 Prize Pool Logic | `compute_monthly_pool` (migration 2) — 40/35/25 · jackpot rollover |
| §8 Charity System | [src/app/charities/](src/app/charities/) · [src/app/(app)/charity/](src/app/(app)/charity/) · [src/app/admin/charities/](src/app/admin/charities/) |
| §9 Winner Verification | [src/app/api/winners/[id]/proof/](src/app/api/winners/[id]/proof/) · [src/app/admin/winners/](src/app/admin/winners/) |
| §10 User Dashboard | [src/app/(app)/dashboard/](src/app/(app)/dashboard/) |
| §11 Admin Dashboard | [src/app/admin/](src/app/admin/) · [src/app/admin/reports/](src/app/admin/reports/) |
| §12 UI/UX | Tailwind + Framer Motion, charity-first homepage (no golf clichés) |
| §13 Technical | Mobile-first · HTTPS-only (proxy) · JWT via Supabase · Resend emails |
| §14 Scalability | Config-driven (`platform_config` table) · multi-currency-ready · config-table %s |

## Decisions filling PRD gaps

| Gap | Default | Rationale |
| --- | --- | --- |
| Price points | £10/mo, £99/yr | Round, meaningful for pool demo |
| Currency | GBP (configurable) | UK/charity-golf-day tone; `currency` column on every money row + env var |
| Subscription split | 50% pool / 10% charity / 40% ops | PRD fixes only tier split (40/35/25) and charity min (10%). All three stored in `platform_config` |
| Brand | GolfDraw | PRD deliberately omits name |
| Stripe mode | test only | PRD says "demo deployment" and names Stripe as the default |
