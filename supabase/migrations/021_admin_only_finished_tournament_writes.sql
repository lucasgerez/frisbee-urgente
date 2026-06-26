-- After a tournament is finished, only admins can change data linked to it.

create or replace function public.assert_can_write_tournament_data(selected_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return;
  end if;

  if public.is_tournament_finished(selected_tournament_id) then
    raise exception 'Apenas admins podem editar dados de torneios encerrados.';
  end if;
end;
$$;

create or replace function public.assert_can_write_game_data(selected_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_tournament_id uuid;
begin
  select tournament_id into selected_tournament_id
  from public.games
  where id = selected_game_id;

  if selected_tournament_id is null then
    raise exception 'Jogo nao encontrado.';
  end if;

  perform public.assert_can_write_tournament_data(selected_tournament_id);
end;
$$;

create or replace function public.prevent_non_admin_finished_tournament_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_can_write_tournament_data(coalesce(old.id, new.id));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.prevent_non_admin_finished_tournament_team_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_can_write_tournament_data(coalesce(old.tournament_id, new.tournament_id));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.prevent_non_admin_finished_roster_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_can_write_tournament_data(coalesce(old.tournament_id, new.tournament_id));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.prevent_non_admin_finished_game_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.tournament_id is distinct from new.tournament_id then
    perform public.assert_can_write_tournament_data(old.tournament_id);
    perform public.assert_can_write_tournament_data(new.tournament_id);
  else
    perform public.assert_can_write_tournament_data(coalesce(old.tournament_id, new.tournament_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.prevent_non_admin_finished_goal_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.game_id is distinct from new.game_id then
    perform public.assert_can_write_game_data(old.game_id);
    perform public.assert_can_write_game_data(new.game_id);
  else
    perform public.assert_can_write_game_data(coalesce(old.game_id, new.game_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.prevent_non_admin_finished_defense_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.game_id is distinct from new.game_id then
    perform public.assert_can_write_game_data(old.game_id);
    perform public.assert_can_write_game_data(new.game_id);
  else
    perform public.assert_can_write_game_data(coalesce(old.game_id, new.game_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.prevent_non_admin_finished_spirit_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.game_id is distinct from new.game_id then
    perform public.assert_can_write_game_data(old.game_id);
    perform public.assert_can_write_game_data(new.game_id);
  else
    perform public.assert_can_write_game_data(coalesce(old.game_id, new.game_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.prevent_non_admin_finished_mvp_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.game_id is distinct from new.game_id then
    perform public.assert_can_write_game_data(old.game_id);
    perform public.assert_can_write_game_data(new.game_id);
  else
    perform public.assert_can_write_game_data(coalesce(old.game_id, new.game_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_non_admin_finished_tournament_update on public.tournaments;
create trigger trg_prevent_non_admin_finished_tournament_update
before update or delete on public.tournaments
for each row execute function public.prevent_non_admin_finished_tournament_update();

drop trigger if exists trg_prevent_non_admin_finished_tournament_team_write on public.tournament_teams;
create trigger trg_prevent_non_admin_finished_tournament_team_write
before insert or update or delete on public.tournament_teams
for each row execute function public.prevent_non_admin_finished_tournament_team_write();

drop trigger if exists trg_prevent_non_admin_finished_roster_write on public.tournament_roster_players;
create trigger trg_prevent_non_admin_finished_roster_write
before insert or update or delete on public.tournament_roster_players
for each row execute function public.prevent_non_admin_finished_roster_write();

drop trigger if exists trg_prevent_non_admin_finished_game_write on public.games;
create trigger trg_prevent_non_admin_finished_game_write
before insert or update or delete on public.games
for each row execute function public.prevent_non_admin_finished_game_write();

drop trigger if exists trg_prevent_non_admin_finished_goal_write on public.goals;
create trigger trg_prevent_non_admin_finished_goal_write
before insert or update or delete on public.goals
for each row execute function public.prevent_non_admin_finished_goal_write();

drop trigger if exists trg_prevent_non_admin_finished_defense_write on public.defenses;
create trigger trg_prevent_non_admin_finished_defense_write
before insert or update or delete on public.defenses
for each row execute function public.prevent_non_admin_finished_defense_write();

drop trigger if exists trg_prevent_non_admin_finished_spirit_write on public.spirit_scores;
create trigger trg_prevent_non_admin_finished_spirit_write
before insert or update or delete on public.spirit_scores
for each row execute function public.prevent_non_admin_finished_spirit_write();

drop trigger if exists trg_prevent_non_admin_finished_mvp_write on public.match_mvps;
create trigger trg_prevent_non_admin_finished_mvp_write
before insert or update or delete on public.match_mvps
for each row execute function public.prevent_non_admin_finished_mvp_write();
