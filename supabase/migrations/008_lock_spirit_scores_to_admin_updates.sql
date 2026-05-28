-- Lock Spirit scores after creation. Editors/admins can create; only admins can correct.

create or replace function public.prevent_duplicate_spirit_score()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.spirit_scores existing
    where existing.game_id = new.game_id
      and existing.evaluated_team_id = new.evaluated_team_id
      and existing.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'Pontuacao de espirito ja cadastrada para este time neste jogo.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_duplicate_spirit_score on public.spirit_scores;
create trigger trg_prevent_duplicate_spirit_score
before insert or update on public.spirit_scores
for each row execute function public.prevent_duplicate_spirit_score();

drop policy if exists "spirit scores are updateable by creator and admins" on public.spirit_scores;
drop policy if exists "spirit scores are deletable by creator and admins" on public.spirit_scores;
drop policy if exists "spirit scores are updateable by admins" on public.spirit_scores;
drop policy if exists "spirit scores are deletable by admins" on public.spirit_scores;

create policy "spirit scores are updateable by admins"
on public.spirit_scores
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "spirit scores are deletable by admins"
on public.spirit_scores
for delete
to authenticated
using (public.is_admin());
