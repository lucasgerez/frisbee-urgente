-- Correct an existing MVP selection through an explicit admin-only operation.
-- The validation trigger still enforces team membership and player genders.

create or replace function public.update_match_mvp_as_admin(
  mvp_id uuid,
  selected_team_id uuid,
  selected_male_player_id uuid,
  selected_female_player_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas admins podem corrigir MVPs.';
  end if;

  update public.match_mvps
  set
    team_id = selected_team_id,
    male_player_id = selected_male_player_id,
    female_player_id = selected_female_player_id
  where id = mvp_id;

  if not found then
    raise exception 'MVP nao encontrado.';
  end if;
end;
$$;

revoke all on function public.update_match_mvp_as_admin(uuid, uuid, uuid, uuid) from public;
grant execute on function public.update_match_mvp_as_admin(uuid, uuid, uuid, uuid) to authenticated;
