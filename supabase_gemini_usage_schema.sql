-- Server-side Gemini usage limiter (per user per day)
--
-- How to apply:
-- - Run this SQL in Supabase SQL editor.
-- - Then set Edge Function secrets:
--   - SUPABASE_URL
--   - SUPABASE_SERVICE_ROLE_KEY
--   - SUPABASE_ANON_KEY
--   - GEMINI_API_KEY
--
-- Notes:
-- - This enforces a hard cap of 1500 requests/day per user.
-- - The Edge Function should call the RPC before each Gemini request.

create table if not exists public.gemini_usage_daily (
  user_id uuid not null,
  day date not null,
  total_requests integer not null default 0,
  by_type jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

comment on table public.gemini_usage_daily is 'Server-side daily usage counters for Gemini calls (per user)';

-- Deny direct client writes/reads by default; Edge Functions use service role.
revoke all on table public.gemini_usage_daily from anon;
revoke all on table public.gemini_usage_daily from authenticated;

-- Optional: allow admins to read (if you have an admin role system + RLS).
-- For now, keep it locked down.

create or replace function public.check_and_increment_gemini_usage(p_request_type text)
returns table (
  allowed boolean,
  daily_limit integer,
  total_requests integer,
  remaining integer
)
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_day date := current_date;
  v_limit integer := 1500;
  v_new_total integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  -- Try insert; if exists, increment only if still under limit.
  insert into public.gemini_usage_daily (user_id, day, total_requests, by_type)
  values (
    v_user_id,
    v_day,
    1,
    jsonb_build_object(coalesce(nullif(trim(p_request_type), ''), 'unknown'), 1)
  )
  on conflict (user_id, day)
  do update
    set total_requests = public.gemini_usage_daily.total_requests + 1,
        by_type = jsonb_set(
          public.gemini_usage_daily.by_type,
          array[coalesce(nullif(trim(p_request_type), ''), 'unknown')],
          to_jsonb(coalesce((public.gemini_usage_daily.by_type ->> coalesce(nullif(trim(p_request_type), ''), 'unknown'))::int, 0) + 1),
          true
        ),
        updated_at = now()
    where public.gemini_usage_daily.total_requests < v_limit
  returning public.gemini_usage_daily.total_requests into v_new_total;

  if v_new_total is null then
    -- No row was inserted/updated due to limit.
    select gud.total_requests into v_new_total
    from public.gemini_usage_daily gud
    where gud.user_id = v_user_id and gud.day = v_day;

    allowed := false;
    daily_limit := v_limit;
    total_requests := coalesce(v_new_total, v_limit);
    remaining := greatest(v_limit - total_requests, 0);
    return next;
    return;
  end if;

  allowed := true;
  daily_limit := v_limit;
  total_requests := v_new_total;
  remaining := greatest(v_limit - v_new_total, 0);
  return next;
end;
$$;

revoke all on function public.check_and_increment_gemini_usage(text) from anon;
revoke all on function public.check_and_increment_gemini_usage(text) from authenticated;

grant execute on function public.check_and_increment_gemini_usage(text) to authenticated;

-- Important: because this is SECURITY DEFINER, lock the search_path.
alter function public.check_and_increment_gemini_usage(text) set search_path = public, auth;
