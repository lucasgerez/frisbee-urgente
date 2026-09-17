-- Tag opcional marcando um jogo como decisivo: final do torneio, ou disputa
-- de 3º/4º lugar. NULL (padrão de toda linha existente e futura, a menos que
-- o organizador defina explicitamente) significa "jogo normal" — mudança
-- puramente aditiva: sem backfill, sem NOT NULL, sem alterar comportamento
-- de escrita/RLS existente. "Decisivo" é simplesmente `stage is not null`.

create type public.game_stage as enum ('final', 'third_place');

alter table public.games
  add column if not exists stage public.game_stage;
