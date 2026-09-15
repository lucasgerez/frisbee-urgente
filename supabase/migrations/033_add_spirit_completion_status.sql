-- Spirit-of-the-Game compliance tracker: lets organizers (not just admins)
-- see which teams still owe a spirit score for a finished game, without
-- waiting for the whole tournament to end (unlike the public stats RPCs,
-- which gate on is_tournament_finished) and without exposing the actual
-- scores. spirit_scores RLS only lets a user see rows they created, so this
-- has to be a security definer function (same pattern as
-- get_public_tournament_spirit_stats), not a plain view.

create or replace function public.get_tournament_spirit_completion()
returns table (
  tournament_id uuid,
  game_id uuid,
  team_a_id uuid,
  team_a_name text,
  team_b_id uuid,
  team_b_name text,
  game_date timestamptz,
  team_a_submitted_spirit boolean,
  team_b_submitted_spirit boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    games.tournament_id,
    games.id as game_id,
    games.team_a_id,
    coalesce(tt_a.team_name, team_a.name) as team_a_name,
    games.team_b_id,
    coalesce(tt_b.team_name, team_b.name) as team_b_name,
    games.started_at as game_date,
    exists (
      select 1 from public.spirit_scores
      where spirit_scores.game_id = games.id
        and spirit_scores.evaluated_team_id = games.team_b_id
        and spirit_scores.archived_at is null
    ) as team_a_submitted_spirit,
    exists (
      select 1 from public.spirit_scores
      where spirit_scores.game_id = games.id
        and spirit_scores.evaluated_team_id = games.team_a_id
        and spirit_scores.archived_at is null
    ) as team_b_submitted_spirit
  from public.games
  join public.teams team_a on team_a.id = games.team_a_id
  join public.teams team_b on team_b.id = games.team_b_id
  left join public.tournament_teams tt_a
    on tt_a.tournament_id = games.tournament_id and tt_a.team_id = games.team_a_id
  left join public.tournament_teams tt_b
    on tt_b.tournament_id = games.tournament_id and tt_b.team_id = games.team_b_id
  where games.status = 'finished'
    and games.archived_at is null
    and (
      public.is_admin()
      or public.is_editor()
      or public.is_tournament_organizer(games.tournament_id)
    )
  order by games.started_at desc nulls last;
$$;

grant execute on function public.get_tournament_spirit_completion() to authenticated;
