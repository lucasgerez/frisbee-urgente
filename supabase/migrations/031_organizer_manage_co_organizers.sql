-- Allow the primary organizer of a tournament to manage their own
-- tournament_co_organizers rows (invite/remove co-organizers), not just admins.
-- This is a separate permissive policy; Postgres OR's it with the existing
-- "writable by admins" policy, so admins keep full access unchanged.

create policy "tournament_co_organizers are writable by the primary organizer"
on public.tournament_co_organizers
for all
to authenticated
using (
  exists (
    select 1 from public.tournaments
    where id = tournament_id and organizer_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.tournaments
    where id = tournament_id and organizer_id = auth.uid()
  )
);
