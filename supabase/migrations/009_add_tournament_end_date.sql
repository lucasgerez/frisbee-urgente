-- Add an optional tournament end date.

alter table public.tournaments
add column if not exists end_date date;
