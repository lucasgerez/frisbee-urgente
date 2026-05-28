-- Tournament stats are admin-only until the tournament end date has passed.

create or replace function public.is_tournament_finished(tournament_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tournaments
    where id = tournament_id
      and end_date is not null
      and end_date < current_date
  );
$$;

create or replace function public.is_spirit_score_public(score_game_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.games
    where id = score_game_id
      and public.is_tournament_finished(tournament_id)
  );
$$;

create or replace function public.is_match_mvp_public(mvp_game_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.games
    where id = mvp_game_id
      and public.is_tournament_finished(tournament_id)
  );
$$;

drop policy if exists "spirit scores are visible to creator and admins" on public.spirit_scores;
drop policy if exists "spirit scores are visible to creator admins and finished tournaments" on public.spirit_scores;

create policy "spirit scores are visible to creator admins and finished tournaments"
on public.spirit_scores
for select
to anon, authenticated
using (
  public.is_spirit_score_public(game_id)
  or public.is_admin()
  or created_by = auth.uid()
);

drop policy if exists "match mvps are readable by everyone" on public.match_mvps;
drop policy if exists "match mvps are visible to creator admins and finished tournaments" on public.match_mvps;

create policy "match mvps are visible to creator admins and finished tournaments"
on public.match_mvps
for select
to anon, authenticated
using (
  public.is_match_mvp_public(game_id)
  or public.is_admin()
  or created_by = auth.uid()
);
