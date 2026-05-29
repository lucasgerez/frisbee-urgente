-- Add optional player profile fields.

alter table players
  add column nickname text,
  add column number text;
