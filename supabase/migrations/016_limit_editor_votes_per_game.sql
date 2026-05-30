-- Editors can submit only one MVP and one spirit score per game.
-- Admins remain unrestricted so they can fill or correct either team slot.

create or replace function public.prevent_editor_duplicate_match_mvp()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    perform pg_advisory_xact_lock(
      hashtextextended('match_mvp:' || new.game_id::text || ':' || new.created_by::text, 0)
    );

    if exists (
      select 1
      from public.match_mvps existing
      where existing.game_id = new.game_id
        and existing.created_by = new.created_by
    ) then
      raise exception 'Editor ja cadastrou MVP para este jogo.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_editor_duplicate_match_mvp on public.match_mvps;
create trigger trg_prevent_editor_duplicate_match_mvp
before insert on public.match_mvps
for each row execute function public.prevent_editor_duplicate_match_mvp();

create or replace function public.prevent_editor_duplicate_spirit_score()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    perform pg_advisory_xact_lock(
      hashtextextended('spirit_score:' || new.game_id::text || ':' || new.created_by::text, 0)
    );

    if exists (
      select 1
      from public.spirit_scores existing
      where existing.game_id = new.game_id
        and existing.created_by = new.created_by
    ) then
      raise exception 'Editor ja cadastrou pontuacao de espirito para este jogo.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_editor_duplicate_spirit_score on public.spirit_scores;
create trigger trg_prevent_editor_duplicate_spirit_score
before insert on public.spirit_scores
for each row execute function public.prevent_editor_duplicate_spirit_score();
