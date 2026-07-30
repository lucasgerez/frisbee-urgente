-- Add "organizador" role: can create tournaments and manage only the tournaments
-- they organize. "organizador" is deliberately its own category, not folded into
-- is_editor() (which today means "editor or admin" per migration 006) - this keeps
-- the pre-existing editor/admin semantics untouched.

alter table public.tournaments
add column if not exists organizer_id uuid references auth.users(id) on delete set null default auth.uid();

create or replace function public.is_organizer()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'organizador';
$$;

create or replace function public.is_tournament_organizer(selected_tournament_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_organizer() and exists (
    select 1 from public.tournaments
    where id = selected_tournament_id
      and organizer_id = auth.uid()
  );
$$;

drop policy if exists "tournaments are writable by editor users" on public.tournaments;
drop policy if exists "tournaments are insertable by editors admins and organizers" on public.tournaments;
drop policy if exists "tournaments are updateable by owners" on public.tournaments;
drop policy if exists "tournaments are deletable by admins" on public.tournaments;

create policy "tournaments are insertable by editors admins and organizers"
on public.tournaments
for insert
to authenticated
with check (public.is_admin() or public.is_editor() or public.is_organizer());

create policy "tournaments are updateable by owners"
on public.tournaments
for update
to authenticated
using (public.is_admin() or public.is_editor() or public.is_tournament_organizer(id))
with check (public.is_admin() or public.is_editor() or public.is_tournament_organizer(id));

create policy "tournaments are deletable by admins"
on public.tournaments
for delete
to authenticated
using (public.is_admin());

create or replace function public.prevent_non_admin_tournament_organizer_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and new.organizer_id is distinct from old.organizer_id then
    raise exception 'Apenas admins podem reatribuir o organizador de um torneio.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_non_admin_tournament_organizer_change on public.tournaments;
create trigger trg_prevent_non_admin_tournament_organizer_change
before update on public.tournaments
for each row execute function public.prevent_non_admin_tournament_organizer_change();

drop policy if exists "tournament_teams are writable by editor users" on public.tournament_teams;
drop policy if exists "tournament_teams are writable by editors admins and organizers" on public.tournament_teams;

create policy "tournament_teams are writable by editors admins and organizers"
on public.tournament_teams
for all
to authenticated
using (public.is_admin() or public.is_editor() or public.is_tournament_organizer(tournament_id))
with check (public.is_admin() or public.is_editor() or public.is_tournament_organizer(tournament_id));

drop policy if exists "tournament roster players are writable by editors" on public.tournament_roster_players;
drop policy if exists "tournament roster players are writable by editors admins and organizers" on public.tournament_roster_players;

create policy "tournament roster players are writable by editors admins and organizers"
on public.tournament_roster_players
for all
to authenticated
using (public.is_admin() or public.is_editor() or public.is_tournament_organizer(tournament_id))
with check (public.is_admin() or public.is_editor() or public.is_tournament_organizer(tournament_id));
