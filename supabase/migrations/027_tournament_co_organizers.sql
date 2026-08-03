-- Support multiple organizers per tournament via a junction table.
-- The existing organizer_id on tournaments stays as the "primary" organizer
-- (admin-assigned during tournament creation/edit). This table adds extras.
-- is_tournament_organizer() is updated to check both sources.

create table public.tournament_co_organizers (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  added_by      uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

alter table public.tournament_co_organizers enable row level security;

create policy "tournament_co_organizers are publicly readable"
on public.tournament_co_organizers
for select
using (true);

create policy "tournament_co_organizers are writable by admins"
on public.tournament_co_organizers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Extend is_tournament_organizer to also match co-organizers.
create or replace function public.is_tournament_organizer(selected_tournament_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_organizer() and (
    exists (
      select 1 from public.tournaments
      where id = selected_tournament_id
        and organizer_id = auth.uid()
    )
    or exists (
      select 1 from public.tournament_co_organizers
      where tournament_id = selected_tournament_id
        and user_id = auth.uid()
    )
  );
$$;
