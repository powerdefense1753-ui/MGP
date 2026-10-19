begin;
-- Independent usage analytics; community moderation policies remain unchanged.
create table if not exists public.usage_gateway_keys(key_hash text primary key);
create table if not exists public.usage_events(
 event_id uuid primary key, visitor_id uuid not null, session_id uuid not null,
 occurred_at timestamptz not null, received_at timestamptz not null default now(),
 name text not null check(name in ('visit','discovery','game_open','store_click','save','feedback_open','submit_attempt','submit_success','submit_failure','media_error')),
 category text, game_id text, source text not null, device text not null, language text not null, attributes jsonb not null default '{}'
);
create index if not exists usage_events_date on public.usage_events(occurred_at);
create index if not exists usage_events_session on public.usage_events(session_id,occurred_at);
create table if not exists public.usage_limits(client_hash text primary key, minute_start timestamptz not null, minute_count int not null, day_start date not null, day_count int not null);
alter table public.usage_gateway_keys enable row level security;
alter table public.usage_events enable row level security;
alter table public.usage_limits enable row level security;
revoke all on public.usage_gateway_keys,public.usage_events,public.usage_limits from anon,authenticated;

create or replace function public.usage_ingest(p_key text,p_client_hash text,p_events jsonb) returns jsonb
language plpgsql security definer set search_path=public,extensions as $$
declare e jsonb; n int; accepted int:=0; ok boolean; attrs jsonb; k text; value numeric; stamp timestamptz;
begin
 if not exists(select 1 from usage_gateway_keys where key_hash=encode(digest(p_key,'sha256'),'hex')) then raise exception 'forbidden' using errcode='42501'; end if;
 if p_client_hash !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events) not between 1 and 20 or octet_length(p_events::text)>11000 then raise exception 'invalid'; end if;
 n:=jsonb_array_length(p_events);
 insert into usage_limits values(p_client_hash,date_trunc('minute',now()),n,current_date,n)
 on conflict(client_hash) do update set minute_start=date_trunc('minute',now()),minute_count=case when usage_limits.minute_start<date_trunc('minute',now()) then n else usage_limits.minute_count+n end,day_start=current_date,day_count=case when usage_limits.day_start<current_date then n else usage_limits.day_count+n end
 where (usage_limits.minute_start<date_trunc('minute',now()) or usage_limits.minute_count+n<=120) and (usage_limits.day_start<current_date or usage_limits.day_count+n<=10000) returning true into ok;
 if not coalesce(ok,false) then return jsonb_build_object('rate_limited',true); end if;
 for e in select * from jsonb_array_elements(p_events) loop
  if e->>'name' not in ('visit','discovery','game_open','store_click','save','feedback_open','submit_attempt','submit_success','submit_failure','media_error') or e->>'name' is null then raise exception 'invalid event'; end if;
  stamp:=(e->>'occurred_at')::timestamptz;
  if stamp is null or stamp<now()-interval '1 day' or stamp>now()+interval '5 minutes' then raise exception 'invalid time'; end if;
  if e ? 'category' and e->>'category' not in ('strategy','match3','merge','hypercasual') then raise exception 'invalid category'; end if;
  if e ? 'game_id' and (e->>'game_id' !~ '^[a-zA-Z0-9_.-]{1,200}$') then raise exception 'invalid game'; end if;
  if e->>'source' not in ('direct','search','social','referral') or e->>'device' not in ('mobile','tablet','desktop') or e->>'language' not in ('zh','en','other') then raise exception 'invalid context'; end if;
  attrs:='{}';
  foreach k in array array['result_count','filter_count','query_length'] loop
   if e ? k then
    if jsonb_typeof(e->k)<>'number' then raise exception 'invalid metric'; end if;
    value:=(e->>k)::numeric;
    if value<0 or value<>trunc(value) or value>(case k when 'result_count' then 100000 when 'filter_count' then 100 else 200 end) then raise exception 'invalid metric'; end if;
    attrs:=attrs||jsonb_build_object(k,value);
   end if;
  end loop;
  if e->>'kind' in ('comment','feedback') then attrs:=attrs||jsonb_build_object('kind',e->>'kind'); end if;
  if jsonb_typeof(e->'active')='boolean' then attrs:=attrs||jsonb_build_object('active',e->'active'); end if;
  insert into usage_events(event_id,visitor_id,session_id,occurred_at,name,category,game_id,source,device,language,attributes)
  values((e->>'event_id')::uuid,(e->>'visitor_id')::uuid,(e->>'session_id')::uuid,stamp,e->>'name',e->>'category',e->>'game_id',e->>'source',e->>'device',e->>'language',attrs) on conflict(event_id) do nothing;
  if found then accepted:=accepted+1; end if;
 end loop;
 delete from usage_events where occurred_at<now()-interval '90 days';
 delete from usage_limits where day_start<current_date-2;
 return jsonb_build_object('accepted',accepted);
end $$;
revoke all on function public.usage_ingest(text,text,jsonb) from public;
grant execute on function public.usage_ingest(text,text,jsonb) to anon,authenticated;

create or replace function public.usage_metrics(p_from timestamptz,p_to timestamptz) returns jsonb
language sql security definer set search_path=public as $$
with e as materialized(select * from usage_events where occurred_at>=p_from and occurred_at<p_to),
s as(select session_id,min(occurred_at) filter(where name='discovery') d from e group by session_id),
f as(select s.session_id,s.d,min(e.occurred_at) filter(where e.name='game_open' and e.occurred_at>=s.d) g from s left join e using(session_id) group by s.session_id,s.d),
ff as(select f.session_id,f.d,f.g,min(e.occurred_at) filter(where e.name='store_click' and e.occurred_at>=f.g) o from f left join e using(session_id) group by f.session_id,f.d,f.g)
select jsonb_build_object('events',count(*),'visitors',count(distinct visitor_id),'sessions',count(distinct session_id),'visits',count(*) filter(where name='visit'),'discoveries',count(*) filter(where name='discovery'),'zero_results',count(*) filter(where name='discovery' and attributes->>'result_count'='0'),'details',count(*) filter(where name='game_open'),'outbound',count(*) filter(where name='store_click'),'submit_attempts',count(*) filter(where name='submit_attempt'),'submit_success',count(*) filter(where name='submit_success'),'submit_failures',count(*) filter(where name='submit_failure'),'media_errors',count(*) filter(where name='media_error'),'discovery_sessions',(select count(*) from ff where d is not null),'detail_sessions',(select count(*) from ff where g is not null),'outbound_sessions',(select count(*) from ff where o is not null)) from e;
$$;
revoke all on function public.usage_metrics(timestamptz,timestamptz) from public,anon,authenticated;

create or replace function public.usage_summary(p_days int default 7) returns jsonb
language plpgsql security definer set search_path=public as $$
declare start_at timestamptz; finish_at timestamptz; result jsonb;
begin
 if not exists(select 1 from community_moderators where user_id=auth.uid()) then raise exception 'forbidden' using errcode='42501'; end if;
 if p_days not in (7,28) then raise exception 'invalid range'; end if;
 finish_at:=(date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')+interval '1 day'; start_at:=finish_at-make_interval(days=>p_days);
 with e as materialized(select * from usage_events where occurred_at>=start_at and occurred_at<finish_at)
 select jsonb_build_object('from',start_at,'to',finish_at,'generated_at',now(),'current',usage_metrics(start_at,finish_at),'previous',usage_metrics(start_at-make_interval(days=>p_days),start_at),
 'daily',(select coalesce(jsonb_agg(x order by x.day),'[]') from (select to_char(occurred_at at time zone 'UTC','YYYY-MM-DD') AS day,count(*) filter(where name='visit') visits,count(distinct session_id) sessions from e group by 1)x),
 'sources',(select coalesce(jsonb_agg(x order by x.count desc),'[]') from (select source label,count(*) count from e where name='visit' group by source)x),
 'devices',(select coalesce(jsonb_agg(x order by x.count desc),'[]') from (select device label,count(distinct session_id) count from e group by device)x),
 'categories',(select coalesce(jsonb_agg(x order by x.count desc),'[]') from (select category label,count(*) count from e where category is not null and name in ('game_open','store_click','discovery') group by category)x),
 'games',(select coalesce(jsonb_agg(x order by x.details desc),'[]') from (select game_id id,count(*) filter(where name='game_open') details,count(*) filter(where name='store_click') outbound,count(*) filter(where name='save' and attributes->>'active'='true') saves from e where game_id is not null group by game_id order by details desc limit 20)x)) into result;
 return result;
end $$;
revoke all on function public.usage_summary(int) from public,anon;
grant execute on function public.usage_summary(int) to authenticated;

commit;


