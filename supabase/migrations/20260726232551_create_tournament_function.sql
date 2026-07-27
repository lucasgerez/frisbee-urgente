create or replace function public.create_tournament(
  p_name text,
  p_end_date timestamptz,
  p_rules text,
  p_team_ids uuid[]
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tournament public.tournaments;
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User is not authenticated';
  end if;

  if not public.is_editor() then
    raise exception 'User is not allowed to create tournaments';
  end if;

  insert into public.tournaments (
    name,
    end_date
  )
  values (
   p_name,
   p_end_date
  )
  returning * into v_tournament;

  insert into public.tournament_rules (
    tournament_id,
    rules,
    created_by,
    updated_by
  )
  values (
    v_tournament.id,
    p_rules,
    v_user_id,
    v_user_id
  );

if p_team_ids is not null and cardinality(p_team_ids) > 0 then
  insert into public.tournament_teams (
    tournament_id,
    team_id
  )
  select
    v_tournament.id,
    team_id
  from unnest(p_team_ids) as team_id;
end if;

return jsonb_build_object(
  'id', v_tournament.id,
  'name', v_tournament.name,
  'end_date', v_tournament.end_date,
  'created_at', v_tournament.created_at,
  'archived_at', v_tournament.archived_at,
  'rules', p_rules
);
end;
$$;