-- Organizers can manage games (and their goals/defenses/spirit scores/match MVPs)
-- only within the tournament they organize - scoped equivalent of editor permissions.

create or replace function public.is_game_tournament_organizer(selected_game_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.games
    where id = selected_game_id
      and public.is_tournament_organizer(games.tournament_id)
  );
$$;

-- games: insert/update/delete scoped to the organizer's own tournament.

drop policy if exists "games are insertable by editors and admins" on public.games;
drop policy if exists "games are insertable by editors admins and organizers" on public.games;

create policy "games are insertable by editors admins and organizers"
on public.games
for insert
to authenticated
with check (public.is_editor() or public.is_tournament_organizer(tournament_id));

drop policy if exists "games status is updateable by editors and admins" on public.games;
drop policy if exists "games are updateable by editors admins and organizers" on public.games;

create policy "games are updateable by editors admins and organizers"
on public.games
for update
to authenticated
using (public.is_editor() or public.is_tournament_organizer(tournament_id))
with check (public.is_editor() or public.is_tournament_organizer(tournament_id));

drop policy if exists "games are deletable by admins" on public.games;
drop policy if exists "games are deletable by admins and organizers" on public.games;

create policy "games are deletable by admins and organizers"
on public.games
for delete
to authenticated
using (public.is_admin() or public.is_tournament_organizer(tournament_id));

-- Only admins may still change a game's team/tournament assignment, unless the
-- organizer owns both the old and the new tournament (can't "steal" a game by
-- moving it into their own tournament from someone else's).

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

  if public.is_tournament_organizer(old.tournament_id) and public.is_tournament_organizer(new.tournament_id) then
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

-- goals / defenses: same "for all" shape as before, scoped organizer added.

drop policy if exists "goals are writable by editor users" on public.goals;
drop policy if exists "goals are writable by editors admins and organizers" on public.goals;

create policy "goals are writable by editors admins and organizers"
on public.goals
for all
using (public.is_editor() or public.is_game_tournament_organizer(game_id))
with check (public.is_editor() or public.is_game_tournament_organizer(game_id));

drop policy if exists "defenses are writable by editor users" on public.defenses;
drop policy if exists "defenses are writable by editors admins and organizers" on public.defenses;

create policy "defenses are writable by editors admins and organizers"
on public.defenses
for all
using (public.is_editor() or public.is_game_tournament_organizer(game_id))
with check (public.is_editor() or public.is_game_tournament_organizer(game_id));

-- spirit_scores: organizer can submit/edit/delete their own vote, same as editor today.

drop policy if exists "spirit scores are insertable by editors and admins" on public.spirit_scores;
drop policy if exists "spirit scores are insertable by editors admins and organizers" on public.spirit_scores;

create policy "spirit scores are insertable by editors admins and organizers"
on public.spirit_scores
for insert
to authenticated
with check (
  (public.is_editor() or public.is_game_tournament_organizer(game_id))
  and created_by = auth.uid()
);

drop policy if exists "spirit scores are updateable by creator and admins" on public.spirit_scores;
drop policy if exists "spirit scores are updateable by creator admins and organizers" on public.spirit_scores;

create policy "spirit scores are updateable by creator admins and organizers"
on public.spirit_scores
for update
to authenticated
using (
  (created_by = auth.uid() and (public.is_editor() or public.is_game_tournament_organizer(game_id)))
  or public.is_admin()
)
with check (
  (created_by = auth.uid() and (public.is_editor() or public.is_game_tournament_organizer(game_id)))
  or public.is_admin()
);

drop policy if exists "spirit scores are deletable by creator and admins" on public.spirit_scores;
drop policy if exists "spirit scores are deletable by creator admins and organizers" on public.spirit_scores;

create policy "spirit scores are deletable by creator admins and organizers"
on public.spirit_scores
for delete
to authenticated
using (
  (created_by = auth.uid() and (public.is_editor() or public.is_game_tournament_organizer(game_id)))
  or public.is_admin()
);

-- match_mvps: organizer can submit their own vote (insert only), same as editor
-- today - corrections remain admin-only via update_match_mvp_as_admin().

drop policy if exists "match mvps are insertable by editors and admins" on public.match_mvps;
drop policy if exists "match mvps are insertable by editors admins and organizers" on public.match_mvps;

create policy "match mvps are insertable by editors admins and organizers"
on public.match_mvps
for insert
to authenticated
with check (
  (public.is_editor() or public.is_game_tournament_organizer(game_id))
  and created_by = auth.uid()
);
