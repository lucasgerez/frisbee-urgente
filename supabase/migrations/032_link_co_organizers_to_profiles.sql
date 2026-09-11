-- Fix "Erro ao carregar organizadores": useTournamentCoOrganizers embeds
-- `profile:profiles(full_name)` on tournament_co_organizers, but PostgREST can
-- only embed across an actual foreign key, and user_id only ever FK'd to
-- auth.users (not public.profiles) - so the embed always failed with
-- PGRST200 ("Could not find a relationship between tournament_co_organizers
-- and profiles"). This predates and is unrelated to the primary-organizer RLS
-- policy added in migration 031.

-- Backfill profiles for any auth.users that predate the profile-creation
-- trigger from migration 004, so the new FK below can't be violated by
-- pre-existing co-organizer/organizer rows.
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data ->> 'full_name', null)
from auth.users
on conflict (id) do nothing;

alter table public.tournament_co_organizers
add constraint tournament_co_organizers_user_id_profiles_fkey
foreign key (user_id) references public.profiles(id) on delete cascade;
