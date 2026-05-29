-- Require editor role for all write operations in core app tables.

create or replace function public.is_editor()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'editor';
$$;

alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_teams enable row level security;

drop policy if exists "teams are publicly readable" on public.teams;
drop policy if exists "teams are writable by editor users" on public.teams;
drop policy if exists "players are publicly readable" on public.players;
drop policy if exists "players are writable by editor users" on public.players;
drop policy if exists "tournaments are publicly readable" on public.tournaments;
drop policy if exists "tournaments are writable by editor users" on public.tournaments;
drop policy if exists "tournament_teams are publicly readable" on public.tournament_teams;
drop policy if exists "tournament_teams are writable by editor users" on public.tournament_teams;

create policy "teams are publicly readable"
on public.teams
for select
using (true);

create policy "teams are writable by editor users"
on public.teams
for all
using (public.is_editor())
with check (public.is_editor());

create policy "players are publicly readable"
on public.players
for select
using (true);

create policy "players are writable by editor users"
on public.players
for all
using (public.is_editor())
with check (public.is_editor());

create policy "tournaments are publicly readable"
on public.tournaments
for select
using (true);

create policy "tournaments are writable by editor users"
on public.tournaments
for all
using (public.is_editor())
with check (public.is_editor());

create policy "tournament_teams are publicly readable"
on public.tournament_teams
for select
using (true);

create policy "tournament_teams are writable by editor users"
on public.tournament_teams
for all
using (public.is_editor())
with check (public.is_editor());
