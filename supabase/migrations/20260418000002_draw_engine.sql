-- =========================================================================
-- GolfDraw · Draw engine functions
--   • compute_monthly_pool(period)  — set pool totals from active subs
--   • generate_random_numbers()     — 5 distinct ints 1-45
--   • generate_algorithmic_numbers(weighting) — weighted by score frequency
--   • run_draw(draw_id)             — snapshot entries, match, score tiers
--   • publish_draw(draw_id)         — compute prizes, create winners rows,
--                                     carry 5-match jackpot forward
-- All functions are security definer + auth-gated via is_admin() where
-- appropriate. App calls them via supabase.rpc().
-- =========================================================================

-- Track unclaimed jackpot leaving a draw (for rollover bookkeeping)
alter table public.draws
  add column if not exists jackpot_rollover_out_minor integer not null default 0
    check (jackpot_rollover_out_minor >= 0);

-- -------------------------------------------------------------------------
-- compute_monthly_pool(period)
--   Sums amortized monthly contribution per active subscriber, applies
--   pool_pct from platform_config, splits 40/35/25, rolls in any unclaimed
--   jackpot from the prior month.
-- -------------------------------------------------------------------------
create or replace function public.compute_monthly_pool(p_period date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg                 platform_config%rowtype;
  v_total_minor         bigint := 0;
  v_pool_total_minor    bigint := 0;
  v_pool_5              bigint;
  v_pool_4              bigint;
  v_pool_3              bigint;
  v_rollover_in         bigint := 0;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_cfg from public.platform_config where id = 1;

  -- Sum amortized monthly contribution across currently-active subs.
  select coalesce(sum(
           case plan
             when 'monthly' then price_amount_minor
             when 'yearly'  then (price_amount_minor / 12)::int
           end
         ), 0)
    into v_total_minor
    from public.subscriptions
   where status in ('active', 'trialing')
     and (current_period_end is null or current_period_end > now());

  v_pool_total_minor := (v_total_minor * v_cfg.pool_pct / 100.0)::bigint;

  -- Carry forward any jackpot unclaimed in the prior month's draw.
  select coalesce(sum(jackpot_rollover_out_minor), 0)
    into v_rollover_in
    from public.draws
   where period = (p_period - interval '1 month')::date
     and status = 'published';

  v_pool_5 := (v_pool_total_minor * v_cfg.tier5_share / 100.0)::bigint;
  v_pool_4 := (v_pool_total_minor * v_cfg.tier4_share / 100.0)::bigint;
  v_pool_3 := v_pool_total_minor - v_pool_5 - v_pool_4;  -- absorb rounding

  insert into public.draws (period, pool_total_minor, pool_5_minor, pool_4_minor, pool_3_minor, jackpot_rollover_in_minor)
  values (p_period, v_pool_total_minor, v_pool_5, v_pool_4, v_pool_3, v_rollover_in)
  on conflict (period) do update set
    pool_total_minor          = excluded.pool_total_minor,
    pool_5_minor              = excluded.pool_5_minor,
    pool_4_minor              = excluded.pool_4_minor,
    pool_3_minor              = excluded.pool_3_minor,
    jackpot_rollover_in_minor = excluded.jackpot_rollover_in_minor,
    updated_at                = now();
end;
$$;

-- -------------------------------------------------------------------------
-- generate_random_numbers() → 5 distinct ints 1-45, cryptographically seeded
-- -------------------------------------------------------------------------
create or replace function public.generate_random_numbers()
returns integer[]
language plpgsql
as $$
declare
  v_result integer[];
begin
  -- Draw 5 distinct values from 1..45 using random() ordering.
  select array_agg(n order by rn) into v_result from (
    select n, (gen_random_uuid())::text as rn
      from generate_series(1, 45) n
    order by rn
    limit 5
  ) x;
  return v_result;
end;
$$;

-- -------------------------------------------------------------------------
-- generate_algorithmic_numbers(weighting) → 5 distinct ints weighted by
-- score frequency across all active subscribers' latest 5 scores.
--   most_frequent  → higher-frequency numbers more likely
--   least_frequent → lower-frequency numbers more likely (inverted)
-- -------------------------------------------------------------------------
create or replace function public.generate_algorithmic_numbers(p_weighting draw_weighting)
returns integer[]
language plpgsql
as $$
declare
  v_result integer[] := array[]::integer[];
  v_pick   integer;
  v_cursor integer := 0;
begin
  -- Build frequency base: each number 1..45 seeded with at least 1 weight
  -- so unseen values can still be drawn.
  create temporary table tmp_freq (n integer primary key, w numeric not null) on commit drop;
  insert into tmp_freq (n, w)
  select gs, 1 from generate_series(1, 45) gs;

  with score_counts as (
    select s.value as n, count(*)::numeric as c
      from public.scores s
      join public.subscriptions sub on sub.user_id = s.user_id
     where sub.status in ('active', 'trialing')
       and (sub.current_period_end is null or sub.current_period_end > now())
     group by s.value
  )
  update tmp_freq f
     set w = case p_weighting
               when 'most_frequent'  then f.w + coalesce(sc.c, 0)
               when 'least_frequent' then f.w + (10.0 / (1.0 + coalesce(sc.c, 0)))
             end
    from score_counts sc
   where f.n = sc.n;

  -- Sample 5 distinct numbers without replacement, weighted by w.
  while v_cursor < 5 loop
    select n into v_pick from (
      select n, -ln(1 - random()) / w as key from tmp_freq
    ) q
    order by key asc
    limit 1;

    if v_pick is not null and not (v_pick = any(v_result)) then
      v_result := v_result || v_pick;
      delete from tmp_freq where n = v_pick;
      v_cursor := v_cursor + 1;
    end if;
  end loop;

  return v_result;
end;
$$;

-- -------------------------------------------------------------------------
-- run_draw(draw_id)
--   For each active subscriber, snapshot their latest 5 scores into
--   draw_entries, count matches against winning_numbers, set tier.
--   Requires draw.winning_numbers to be populated first.
-- -------------------------------------------------------------------------
create or replace function public.run_draw(p_draw_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draw draws%rowtype;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_draw from public.draws where id = p_draw_id for update;
  if v_draw.id is null then raise exception 'draw not found'; end if;
  if v_draw.winning_numbers is null then raise exception 'winning_numbers must be set first'; end if;
  if v_draw.status = 'published' then raise exception 'cannot re-run a published draw'; end if;

  -- wipe any previous simulation entries for this draw
  delete from public.draw_entries where draw_id = p_draw_id;

  insert into public.draw_entries (draw_id, user_id, numbers, matched_count, tier)
  select
    p_draw_id,
    u.user_id,
    u.nums,
    cardinality(array(select unnest(u.nums) intersect select unnest(v_draw.winning_numbers))) as matched,
    case
      when cardinality(array(select unnest(u.nums) intersect select unnest(v_draw.winning_numbers))) = 5 then 5
      when cardinality(array(select unnest(u.nums) intersect select unnest(v_draw.winning_numbers))) = 4 then 4
      when cardinality(array(select unnest(u.nums) intersect select unnest(v_draw.winning_numbers))) = 3 then 3
      else null
    end
  from (
    select s.user_id, array_agg(s.value order by s.played_on desc) as nums
      from public.scores s
      join public.subscriptions sub on sub.user_id = s.user_id
     where sub.status in ('active', 'trialing')
       and (sub.current_period_end is null or sub.current_period_end > now())
     group by s.user_id
     having count(*) >= 1
  ) u;

  update public.draws
     set status      = 'simulated',
         simulated_at = now(),
         updated_at  = now()
   where id = p_draw_id;
end;
$$;

-- -------------------------------------------------------------------------
-- publish_draw(draw_id)
--   Computes prize amounts per tier, writes winners rows, handles jackpot
--   rollover when no 5-match, marks draw published.
-- -------------------------------------------------------------------------
create or replace function public.publish_draw(p_draw_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draw       draws%rowtype;
  v_count_5    integer;
  v_count_4    integer;
  v_count_3    integer;
  v_prize_5    integer;
  v_prize_4    integer;
  v_prize_3    integer;
  v_rollover   integer := 0;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_draw from public.draws where id = p_draw_id for update;
  if v_draw.id is null then raise exception 'draw not found'; end if;
  if v_draw.status != 'simulated' then raise exception 'draw must be simulated before publishing'; end if;

  select
    count(*) filter (where tier = 5),
    count(*) filter (where tier = 4),
    count(*) filter (where tier = 3)
    into v_count_5, v_count_4, v_count_3
    from public.draw_entries
   where draw_id = p_draw_id;

  -- Tier 5 — jackpot = pool_5 + rollover_in.  Splits among winners; else rolls over.
  if v_count_5 > 0 then
    v_prize_5 := ((v_draw.pool_5_minor + v_draw.jackpot_rollover_in_minor) / v_count_5)::int;
    insert into public.winners (draw_entry_id, prize_amount_minor, currency)
    select id, v_prize_5, v_draw.currency from public.draw_entries
     where draw_id = p_draw_id and tier = 5;
  else
    v_rollover := v_draw.pool_5_minor + v_draw.jackpot_rollover_in_minor;
  end if;

  if v_count_4 > 0 then
    v_prize_4 := (v_draw.pool_4_minor / v_count_4)::int;
    insert into public.winners (draw_entry_id, prize_amount_minor, currency)
    select id, v_prize_4, v_draw.currency from public.draw_entries
     where draw_id = p_draw_id and tier = 4;
  end if;

  if v_count_3 > 0 then
    v_prize_3 := (v_draw.pool_3_minor / v_count_3)::int;
    insert into public.winners (draw_entry_id, prize_amount_minor, currency)
    select id, v_prize_3, v_draw.currency from public.draw_entries
     where draw_id = p_draw_id and tier = 3;
  end if;

  update public.draws
     set status                    = 'published',
         published_at              = now(),
         jackpot_rollover_out_minor = v_rollover,
         updated_at                = now()
   where id = p_draw_id;

  insert into public.audit_log (actor_id, action, target_type, target_id, payload)
  values (
    auth.uid(), 'draw.published', 'draw', p_draw_id::text,
    jsonb_build_object(
      'winners_5', v_count_5, 'winners_4', v_count_4, 'winners_3', v_count_3,
      'rollover_out', v_rollover
    )
  );
end;
$$;

-- -------------------------------------------------------------------------
-- Storage bucket for winner proof screenshots (RLS applied at policy level)
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('winner-proofs', 'winner-proofs', false)
on conflict do nothing;

create policy "winner proofs — owner write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'winner-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "winner proofs — owner read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'winner-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
