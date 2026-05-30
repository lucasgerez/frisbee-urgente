-- Allow one private MVP and one private spirit score per team in each game.
-- Visibility remains creator/admin before tournament end and public after end.

alter table public.match_mvps
drop constraint if exists match_mvps_game_id_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'match_mvps_game_id_team_id_key'
      and conrelid = 'public.match_mvps'::regclass
  ) then
    alter table public.match_mvps
    add constraint match_mvps_game_id_team_id_key unique (game_id, team_id);
  end if;
end;
$$;

drop policy if exists "match mvps are visible to creator admins and finished tournaments" on public.match_mvps;
drop policy if exists "match mvps are visible to editors admins and finished tournaments" on public.match_mvps;
drop policy if exists "match mvps are visible to creator and admins" on public.match_mvps;

create policy "match mvps are visible to creator and admins"
on public.match_mvps
for select
to anon, authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
);

drop trigger if exists trg_prevent_duplicate_spirit_score on public.spirit_scores;
drop function if exists public.prevent_duplicate_spirit_score();

alter table public.spirit_scores
drop constraint if exists spirit_scores_game_id_evaluated_team_id_created_by_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'spirit_scores_game_id_evaluated_team_id_key'
      and conrelid = 'public.spirit_scores'::regclass
  ) then
    alter table public.spirit_scores
    add constraint spirit_scores_game_id_evaluated_team_id_key unique (game_id, evaluated_team_id);
  end if;
end;
$$;

drop policy if exists "spirit scores are visible to creator admins and finished tournaments" on public.spirit_scores;
drop policy if exists "spirit scores are visible to creator and admins" on public.spirit_scores;

create policy "spirit scores are visible to creator and admins"
on public.spirit_scores
for select
to anon, authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
);
