-- Editors/admins can create games; only admins can edit or delete existing games.

drop policy if exists "games are writable by editor users" on public.games;
drop policy if exists "games are insertable by editors and admins" on public.games;
drop policy if exists "games are updateable by admins" on public.games;
drop policy if exists "games are deletable by admins" on public.games;

create policy "games are insertable by editors and admins"
on public.games
for insert
to authenticated
with check (public.is_editor());

create policy "games are updateable by admins"
on public.games
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "games are deletable by admins"
on public.games
for delete
to authenticated
using (public.is_admin());
