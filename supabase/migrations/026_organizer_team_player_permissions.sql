-- Allow organizers to create and manage teams and players globally,
-- mirroring the same access editors have on these tables.

drop policy if exists "teams are writable by editor users" on public.teams;
create policy "teams are writable by editors admins and organizers"
on public.teams
for all
to authenticated
using (public.is_editor() or public.is_organizer())
with check (public.is_editor() or public.is_organizer());

drop policy if exists "players are writable by editor users" on public.players;
create policy "players are writable by editors admins and organizers"
on public.players
for all
to authenticated
using (public.is_editor() or public.is_organizer())
with check (public.is_editor() or public.is_organizer());
