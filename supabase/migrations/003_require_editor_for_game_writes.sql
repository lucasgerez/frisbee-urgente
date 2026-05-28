-- Require Supabase Auth users with app_metadata.role = 'editor' for game writes.

alter table games enable row level security;
alter table goals enable row level security;
alter table defenses enable row level security;

drop policy if exists "games are publicly readable" on games;
drop policy if exists "games are writable by editor users" on games;
drop policy if exists "goals are publicly readable" on goals;
drop policy if exists "goals are writable by editor users" on goals;
drop policy if exists "defenses are publicly readable" on defenses;
drop policy if exists "defenses are writable by editor users" on defenses;

drop function if exists public.is_editor();

create or replace function public.is_editor()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'editor';
$$;

create policy "games are publicly readable"
on games
for select
using (true);

create policy "games are writable by editor users"
on games
for all
using (public.is_editor())
with check (public.is_editor());

create policy "goals are publicly readable"
on goals
for select
using (true);

create policy "goals are writable by editor users"
on goals
for all
using (public.is_editor())
with check (public.is_editor());

create policy "defenses are publicly readable"
on defenses
for select
using (true);

create policy "defenses are writable by editor users"
on defenses
for all
using (public.is_editor())
with check (public.is_editor());
