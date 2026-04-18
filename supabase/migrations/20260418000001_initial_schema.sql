-- =========================================================================
-- GolfDraw · Initial schema
--   Enforces PRD rules at the database layer:
--     • Score range 1-45 (Stableford) — CHECK constraint
--     • One score per (user, date) — UNIQUE constraint
--     • Latest 5 scores only — trigger prunes older rows
--     • Charity ≥ 10% — CHECK constraint
--     • Role-based access — RLS + is_admin() helper
-- =========================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- -------------------------------------------------------------------------
-- Enums
-- -------------------------------------------------------------------------
create type user_role          as enum ('user', 'admin');
create type subscription_plan  as enum ('monthly', 'yearly');
create type subscription_state as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid');
create type draw_mode          as enum ('random', 'algorithmic');
create type draw_weighting     as enum ('most_frequent', 'least_frequent');
create type draw_status        as enum ('draft', 'simulated', 'published');
create type verification_state as enum ('pending', 'approved', 'rejected');
create type payout_state       as enum ('pending', 'paid');
create type donation_source    as enum ('subscription', 'independent');

-- -------------------------------------------------------------------------
-- profiles — one row per auth.users, mirrors auth + domain attrs
-- -------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              citext not null unique,
  full_name          text,
  role               user_role not null default 'user',
  charity_id         uuid,
  charity_pct        numeric(5,2) not null default 10 check (charity_pct between 10 and 100),
  stripe_customer_id text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- charities
-- -------------------------------------------------------------------------
create table public.charities (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  tagline     text,
  description text not null,
  hero_img    text,
  body        text,
  events      jsonb not null default '[]'::jsonb,
  featured    boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index charities_featured_idx on public.charities (featured) where featured = true;

alter table public.profiles
  add constraint profiles_charity_fk
  foreign key (charity_id) references public.charities (id) on delete set null;

-- -------------------------------------------------------------------------
-- subscriptions
-- -------------------------------------------------------------------------
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.profiles (id) on delete cascade,
  stripe_subscription_id text not null unique,
  plan                   subscription_plan not null,
  status                 subscription_state not null,
  price_amount_minor     integer not null check (price_amount_minor >= 0),
  currency               char(3) not null default 'GBP',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);

-- -------------------------------------------------------------------------
-- scores — Stableford 1-45, one per date, rolling 5
-- -------------------------------------------------------------------------
create table public.scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  value      integer not null check (value between 1 and 45),
  played_on  date not null,
  created_at timestamptz not null default now(),
  unique (user_id, played_on)
);
create index scores_user_played_idx on public.scores (user_id, played_on desc);

-- Keep only the 5 most recent scores (by played_on desc, tiebreak created_at desc)
create or replace function public.enforce_rolling_five_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.scores
  where user_id = new.user_id
    and id not in (
      select id from public.scores
      where user_id = new.user_id
      order by played_on desc, created_at desc
      limit 5
    );
  return new;
end;
$$;

create trigger scores_rolling_five
after insert on public.scores
for each row execute function public.enforce_rolling_five_scores();

-- -------------------------------------------------------------------------
-- donations
-- -------------------------------------------------------------------------
create table public.donations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  charity_id    uuid not null references public.charities (id) on delete restrict,
  amount_minor  integer not null check (amount_minor > 0),
  currency      char(3) not null default 'GBP',
  source        donation_source not null,
  period_month  date,  -- first-of-month; null for one-off donations
  stripe_ref    text,
  created_at    timestamptz not null default now()
);
create index donations_user_idx on public.donations (user_id);
create index donations_charity_idx on public.donations (charity_id);
create index donations_period_idx on public.donations (period_month);

-- -------------------------------------------------------------------------
-- draws — monthly
-- -------------------------------------------------------------------------
create table public.draws (
  id                        uuid primary key default gen_random_uuid(),
  period                    date not null unique,  -- first-of-month
  mode                      draw_mode not null default 'random',
  weighting                 draw_weighting,
  status                    draw_status not null default 'draft',
  winning_numbers           integer[] check (
    winning_numbers is null
    or (
      array_length(winning_numbers, 1) = 5
      and (select bool_and(n between 1 and 45) from unnest(winning_numbers) n)
    )
  ),
  pool_total_minor          integer not null default 0 check (pool_total_minor >= 0),
  pool_5_minor              integer not null default 0 check (pool_5_minor >= 0),
  pool_4_minor              integer not null default 0 check (pool_4_minor >= 0),
  pool_3_minor              integer not null default 0 check (pool_3_minor >= 0),
  jackpot_rollover_in_minor integer not null default 0 check (jackpot_rollover_in_minor >= 0),
  currency                  char(3) not null default 'GBP',
  published_at              timestamptz,
  simulated_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- draw_entries — snapshot of each subscriber's latest 5 scores at draw time
-- -------------------------------------------------------------------------
create table public.draw_entries (
  id             uuid primary key default gen_random_uuid(),
  draw_id        uuid not null references public.draws (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  numbers        integer[] not null check (array_length(numbers, 1) between 1 and 5),
  matched_count  integer not null default 0 check (matched_count between 0 and 5),
  tier           integer check (tier in (3, 4, 5)),
  created_at     timestamptz not null default now(),
  unique (draw_id, user_id)
);
create index draw_entries_draw_tier_idx on public.draw_entries (draw_id, tier);

-- -------------------------------------------------------------------------
-- winners
-- -------------------------------------------------------------------------
create table public.winners (
  id                 uuid primary key default gen_random_uuid(),
  draw_entry_id      uuid not null unique references public.draw_entries (id) on delete cascade,
  prize_amount_minor integer not null check (prize_amount_minor > 0),
  currency           char(3) not null default 'GBP',
  verification       verification_state not null default 'pending',
  proof_url          text,
  rejection_reason   text,
  payout_status      payout_state not null default 'pending',
  paid_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (payout_status = 'pending' or verification = 'approved')
);

-- -------------------------------------------------------------------------
-- platform_config — single-row config (guarded by RLS + check)
-- -------------------------------------------------------------------------
create table public.platform_config (
  id                       smallint primary key default 1 check (id = 1),
  pool_pct                 numeric(5,2) not null default 50 check (pool_pct between 0 and 100),
  charity_min_pct          numeric(5,2) not null default 10 check (charity_min_pct between 0 and 100),
  ops_pct                  numeric(5,2) not null default 40 check (ops_pct between 0 and 100),
  tier5_share              numeric(5,2) not null default 40 check (tier5_share between 0 and 100),
  tier4_share              numeric(5,2) not null default 35 check (tier4_share between 0 and 100),
  tier3_share              numeric(5,2) not null default 25 check (tier3_share between 0 and 100),
  default_currency         char(3) not null default 'GBP',
  updated_at               timestamptz not null default now(),
  check (pool_pct + charity_min_pct + ops_pct = 100),
  check (tier5_share + tier4_share + tier3_share = 100)
);
insert into public.platform_config (id) values (1) on conflict do nothing;

-- -------------------------------------------------------------------------
-- audit_log
-- -------------------------------------------------------------------------
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- -------------------------------------------------------------------------
-- updated_at triggers
-- -------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated    before update on public.profiles       for each row execute function public.tg_set_updated_at();
create trigger subs_set_updated        before update on public.subscriptions  for each row execute function public.tg_set_updated_at();
create trigger charities_set_updated   before update on public.charities      for each row execute function public.tg_set_updated_at();
create trigger draws_set_updated       before update on public.draws          for each row execute function public.tg_set_updated_at();
create trigger winners_set_updated     before update on public.winners        for each row execute function public.tg_set_updated_at();
create trigger plat_cfg_set_updated    before update on public.platform_config for each row execute function public.tg_set_updated_at();

-- -------------------------------------------------------------------------
-- auth.users → profiles bridge
-- -------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- -------------------------------------------------------------------------
-- is_admin() helper — used by RLS policies
-- -------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- -------------------------------------------------------------------------
-- has_active_subscription() helper
-- -------------------------------------------------------------------------
create or replace function public.has_active_subscription(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = p_user
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
  );
$$;

-- =========================================================================
-- Row-Level Security
-- =========================================================================
alter table public.profiles        enable row level security;
alter table public.charities       enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.scores          enable row level security;
alter table public.donations       enable row level security;
alter table public.draws           enable row level security;
alter table public.draw_entries    enable row level security;
alter table public.winners         enable row level security;
alter table public.platform_config enable row level security;
alter table public.audit_log       enable row level security;

-- profiles
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- charities — public read, admin write
create policy charities_public_read on public.charities
  for select using (active or public.is_admin());
create policy charities_admin_write on public.charities
  for all using (public.is_admin()) with check (public.is_admin());

-- subscriptions — user read own, admin read/write all
create policy subs_self_read on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());
create policy subs_admin_write on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

-- scores — user CRUD own; admin read/write all
create policy scores_self_all on public.scores
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- donations — user read own; admin read/write all
create policy donations_self_read on public.donations
  for select using (user_id = auth.uid() or public.is_admin());
create policy donations_admin_write on public.donations
  for all using (public.is_admin()) with check (public.is_admin());
create policy donations_self_insert on public.donations
  for insert with check (user_id = auth.uid() and source = 'independent');

-- draws — public read published; admin read/write all
create policy draws_public_read on public.draws
  for select using (status = 'published' or public.is_admin());
create policy draws_admin_write on public.draws
  for all using (public.is_admin()) with check (public.is_admin());

-- draw_entries — user read own entries on published draws; admin read/write all
create policy draw_entries_self_read on public.draw_entries
  for select using (
    public.is_admin()
    or (
      user_id = auth.uid()
      and exists (select 1 from public.draws d where d.id = draw_id and d.status = 'published')
    )
  );
create policy draw_entries_admin_write on public.draw_entries
  for all using (public.is_admin()) with check (public.is_admin());

-- winners — user read own; admin all.  Proof uploads go through a
-- service-role route handler which validates the caller then writes
-- only the proof_url column (prevents user-side update of prize/status).
create policy winners_self_read on public.winners
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.draw_entries de
      where de.id = draw_entry_id and de.user_id = auth.uid()
    )
  );
create policy winners_admin_write on public.winners
  for all using (public.is_admin()) with check (public.is_admin());

-- platform_config — public read, admin write
create policy platform_config_public_read on public.platform_config
  for select using (true);
create policy platform_config_admin_write on public.platform_config
  for all using (public.is_admin()) with check (public.is_admin());

-- audit_log — admin read only; inserts via service_role
create policy audit_log_admin_read on public.audit_log
  for select using (public.is_admin());
