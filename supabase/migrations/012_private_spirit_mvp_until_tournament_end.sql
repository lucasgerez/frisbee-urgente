-- Spirit and MVP submissions are private to their creator and admins until the
-- tournament end date has passed. Tournament stats remain public after that.

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
drop policy if exists "match mvps are visible to editors admins and finished tournaments" on public.match_mvps;

create policy "match mvps are visible to creator admins and finished tournaments"
on public.match_mvps
for select
to anon, authenticated
using (
  public.is_match_mvp_public(game_id)
  or public.is_admin()
  or created_by = auth.uid()
);
