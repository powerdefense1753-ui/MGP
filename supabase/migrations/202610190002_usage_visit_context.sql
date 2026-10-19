begin;
create table if not exists public.usage_visit_context(
 event_id uuid primary key references public.usage_events(event_id) on delete cascade,
 recorded_at timestamptz not null default now(), ip inet not null,
 country text, region text, browser text not null, os text not null
);
create index if not exists usage_visit_context_date on public.usage_visit_context(recorded_at);
alter table public.usage_visit_context enable row level security;
revoke all on public.usage_visit_context from anon,authenticated;
create or replace function public.usage_ingest_v2(p_key text,p_client_hash text,p_events jsonb,p_context jsonb) returns jsonb
language plpgsql security definer set search_path=public,extensions as $$
declare result jsonb; e jsonb; address inet;
begin
 result:=public.usage_ingest(p_key,p_client_hash,p_events);
 if coalesce((result->>'rate_limited')::boolean,false) then return result; end if;
 address:=(p_context->>'ip')::inet;
 if address is null then raise exception 'invalid context'; end if;
 for e in select * from jsonb_array_elements(p_events) loop
  if e->>'name'='visit' then
   insert into usage_visit_context(event_id,ip,country,region,browser,os)
   select event_id,address,
    case when p_context->>'country' ~ '^[A-Z]{2}$' then p_context->>'country' end,
    case when p_context->>'region' ~ '^[a-zA-Z0-9_-]{1,32}$' then p_context->>'region' end,
    case when p_context->>'browser' in ('Edge','Opera','Firefox','Chrome','Safari') then p_context->>'browser' else 'Other' end,
    case when p_context->>'os' in ('Android','iOS','Windows','macOS','Linux') then p_context->>'os' else 'Other' end
   from usage_events where event_id=(e->>'event_id')::uuid and name='visit'
   on conflict(event_id) do nothing;
  end if;
 end loop;
 delete from usage_visit_context where recorded_at<now()-interval '30 days';
 return result;
end $$;
revoke all on function public.usage_ingest_v2(text,text,jsonb,jsonb) from public;
grant execute on function public.usage_ingest_v2(text,text,jsonb,jsonb) to anon,authenticated;
create or replace function public.usage_summary_v2(p_days int default 7) returns jsonb
language plpgsql security definer set search_path=public as $$
declare result jsonb; recent jsonb;
begin
 result:=public.usage_summary(p_days);
 delete from usage_visit_context where recorded_at<now()-interval '30 days';
 select coalesce(jsonb_agg(x order by x.visited_at desc),'[]') into recent from (
  select e.occurred_at as visited_at,host(c.ip) as ip,c.country,c.region,c.browser,c.os,e.source,e.device
  from usage_events e left join usage_visit_context c on c.event_id=e.event_id and c.recorded_at>=now()-interval '30 days'
  where e.name='visit' and e.occurred_at>=(result->>'from')::timestamptz and e.occurred_at<(result->>'to')::timestamptz
  order by e.occurred_at desc limit 100
 ) x;
 return result||jsonb_build_object('recent_visits',recent,'ip_retention_days',30);
end $$;
revoke all on function public.usage_summary_v2(int) from public,anon;
grant execute on function public.usage_summary_v2(int) to authenticated;
commit;
