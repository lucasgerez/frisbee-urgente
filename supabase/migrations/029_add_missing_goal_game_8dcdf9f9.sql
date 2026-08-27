-- Data fix: a goal was scored in the last minute of a game but never
-- recorded live. Insert it now that the game (and possibly its tournament)
-- has already finished.
--
-- Game:      8dcdf9f9-df48-49ea-8bca-a967ad64e6d9
-- Scorer:    Eduardo Agustin
-- Assist:    Laura Calle Gonzalez
--
-- If the tournament has already ended, trg_prevent_non_admin_finished_goal_write
-- (021) blocks writes to `goals` unless run with an admin JWT, which isn't
-- present when running this directly via the SQL editor. Disable it for this
-- one corrective statement, then restore it (same pattern as
-- 028_fix_callithrix_team_name_typo.sql).

alter table public.goals
disable trigger trg_prevent_non_admin_finished_goal_write;

do $$
declare
  v_game public.games%rowtype;
  v_scorer public.tournament_roster_players%rowtype;
  v_assistant public.tournament_roster_players%rowtype;
  v_last_goal_at timestamptz;
  v_created_at timestamptz;
begin
  select * into v_game
  from public.games
  where id = '8dcdf9f9-df48-49ea-8bca-a967ad64e6d9';

  if not found then
    raise exception 'Jogo 8dcdf9f9-df48-49ea-8bca-a967ad64e6d9 nao encontrado.';
  end if;

  select * into v_scorer
  from public.tournament_roster_players
  where tournament_id = v_game.tournament_id
    and team_id in (v_game.team_a_id, v_game.team_b_id)
    and archived_at is null
    and name = 'Eduardo Agustin';

  if not found then
    raise exception 'Jogador "Eduardo Agustin" nao encontrado no elenco deste torneio para os times deste jogo.';
  end if;

  select * into v_assistant
  from public.tournament_roster_players
  where tournament_id = v_game.tournament_id
    and team_id = v_scorer.team_id
    and archived_at is null
    and name = 'Laura Calle Gonzalez';

  if not found then
    raise exception 'Jogadora "Laura Calle Gonzalez" nao encontrada no elenco do time de "Eduardo Agustin" neste torneio.';
  end if;

  select max(created_at) into v_last_goal_at
  from public.goals
  where game_id = v_game.id
    and archived_at is null;

  v_created_at := coalesce(v_last_goal_at, v_game.started_at, v_game.created_at) + interval '1 second';

  insert into public.goals (
    game_id,
    scorer_id,
    assistant_id,
    scoring_team_id,
    scorer_roster_player_id,
    assistant_roster_player_id,
    created_at
  ) values (
    v_game.id,
    v_scorer.player_id,
    v_assistant.player_id,
    v_scorer.team_id,
    v_scorer.id,
    v_assistant.id,
    v_created_at
  );
end $$;

alter table public.goals
enable trigger trg_prevent_non_admin_finished_goal_write;
