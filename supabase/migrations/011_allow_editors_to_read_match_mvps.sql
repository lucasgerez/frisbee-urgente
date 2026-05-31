-- Editors need to see existing MVP selections in /jogos so they do not try to
-- create another MVP for the same game. Public users still only see MVP stats
-- after the tournament end date.

drop policy if exists "match mvps are visible to creator admins and finished tournaments" on public.match_mvps;

create policy "match mvps are visible to editors admins and finished tournaments"
on public.match_mvps
for select
to anon, authenticated
using (
  public.is_match_mvp_public(game_id)
  or public.is_editor()
  or public.is_admin()
  or created_by = auth.uid()
);
