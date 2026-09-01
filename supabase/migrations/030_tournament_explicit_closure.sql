-- Explicit tournament closure: status column (draft/active/completed) + closed_at,
-- layered on top of the existing end_date-based is_tournament_finished() so all
-- existing write-locking triggers (021) and public-stats policies (010/012/018)
-- pick up manual closure automatically.

create type public.tournament_status as enum ('draft', 'active', 'completed');

alter table public.tournaments
  add column if not exists status public.tournament_status not null default 'active',
  add column if not exists closed_at timestamptz;

create or replace function public.is_tournament_finished(tournament_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tournaments
    where id = tournament_id
      and (
        status = 'completed'
        or (end_date is not null and end_date < current_date)
      )
  );
$$;

-- Extend the existing before-update/delete guard on tournaments to also stamp
-- closed_at server-side on closure, and to require admin to reopen a completed
-- tournament (mirrors prevent_non_admin_tournament_organizer_change in 023).
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

  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.closed_at := now();
  elsif new.status is distinct from 'completed' and old.status = 'completed' then
    if not public.is_admin() then
      raise exception 'Apenas admins podem reabrir um torneio encerrado.';
    end if;
    new.closed_at := null;
  elsif new.status = 'completed' then
    new.closed_at := old.closed_at;
  end if;

  return new;
end;
$$;
