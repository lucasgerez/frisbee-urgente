-- Editors/admins can control game status; only admins can edit game teams/tournament.

drop policy if exists "games are updateable by admins" on public.games;
drop policy if exists "games status is updateable by editors and admins" on public.games;

create policy "games status is updateable by editors and admins"
on public.games
for update
to authenticated
using (public.is_editor())
with check (public.is_editor());

create or replace function public.prevent_non_admin_game_detail_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.created_at is distinct from old.created_at
    or new.tournament_id is distinct from old.tournament_id
    or new.team_a_id is distinct from old.team_a_id
    or new.team_b_id is distinct from old.team_b_id
  then
    raise exception 'Only admins can edit game details.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_non_admin_game_detail_updates on public.games;
create trigger trg_prevent_non_admin_game_detail_updates
before update on public.games
for each row execute function public.prevent_non_admin_game_detail_updates();
