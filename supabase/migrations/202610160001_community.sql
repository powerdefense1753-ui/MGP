-- Anonymous clients cannot write tables. Submissions go through the rate-limited Edge Function.
create table public.community_moderators (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.community_moderators enable row level security;
create policy "moderator sees own membership" on public.community_moderators for select to authenticated using (user_id=auth.uid());
create table public.community_messages (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('comment','feedback')),
 game_id text,
 nickname text not null default 'Anonymous' check(char_length(nickname) between 1 and 40),
 body text not null check(char_length(body) between 3 and 2000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 check ((kind='comment' and game_id is not null and char_length(game_id) between 1 and 200) or (kind='feedback' and game_id is null))
);
create index on public.community_messages(game_id,created_at desc);
alter table public.community_messages enable row level security;
create policy "public approved comments only" on public.community_messages for select to anon, authenticated using (kind='comment' and status='approved');
create policy "moderator reads all" on public.community_messages for select to authenticated using (exists(select 1 from public.community_moderators where user_id=auth.uid()));
create policy "moderator reviews" on public.community_messages for update to authenticated using (exists(select 1 from public.community_moderators where user_id=auth.uid())) with check (exists(select 1 from public.community_moderators where user_id=auth.uid()));
revoke all on public.community_messages from anon, authenticated;
grant select on public.community_messages to anon, authenticated;
grant update(status) on public.community_messages to authenticated;
grant select on public.community_moderators to authenticated;
create table public.community_limits (client_hash text primary key, last_at timestamptz not null, day_start timestamptz not null, day_count int not null);
alter table public.community_limits enable row level security;
revoke all on public.community_limits from anon,authenticated;
create function public.claim_community_submission(p_hash text) returns boolean language plpgsql security definer set search_path=public as $$
declare allowed boolean;
begin
 insert into community_limits values(p_hash,now(),date_trunc('day',now()),1)
 on conflict(client_hash) do update set last_at=now(),day_start=date_trunc('day',now()),day_count=case when community_limits.day_start<date_trunc('day',now()) then 1 else community_limits.day_count+1 end
 where community_limits.last_at<now()-interval '60 seconds' and (community_limits.day_start<date_trunc('day',now()) or community_limits.day_count<10)
 returning true into allowed;
 return coalesce(allowed,false);
end $$;
revoke all on function public.claim_community_submission(text) from public,anon,authenticated;
grant execute on function public.claim_community_submission(text) to service_role;
grant all on public.community_messages,public.community_limits to service_role;
