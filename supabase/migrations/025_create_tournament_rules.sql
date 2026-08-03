create table public.tournament_rules (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  rules text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tournament_rules_tournament_id_key unique (tournament_id)
);

alter table public.tournament_rules enable row level security;

create policy "tournament rules are publicly readable"
on public.tournament_rules
for select
using (true);

create policy "tournament rules are writable by editors admins and organizers"
on public.tournament_rules
for all
using (public.is_editor() or public.is_tournament_organizer(tournament_id))
with check (public.is_editor() or public.is_tournament_organizer(tournament_id));
