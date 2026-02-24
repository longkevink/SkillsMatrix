create table if not exists public.term_aliases (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  canonical_value text not null,
  entity_type text not null check (entity_type in ('show', 'role', 'control_room', 'phrase')),
  confidence_override numeric(4,3),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists term_aliases_unique_active_idx
  on public.term_aliases (lower(alias), entity_type)
  where is_active = true;

create index if not exists term_aliases_entity_type_idx
  on public.term_aliases (entity_type);

create or replace function public.touch_term_aliases_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_term_aliases_updated_at on public.term_aliases;

create trigger set_term_aliases_updated_at
before update on public.term_aliases
for each row
execute function public.touch_term_aliases_updated_at();

insert into public.term_aliases (alias, canonical_value, entity_type, confidence_override, notes)
values
  ('nn', 'Nightly News', 'show', 0.99, 'Common shorthand'),
  ('nightly', 'Nightly News', 'show', 0.95, 'Common shorthand'),
  ('4th hour', '4th Hour Today', 'show', 0.99, 'Common shorthand'),
  ('4th hour today', '4th Hour Today', 'show', 1.0, 'Exact alias'),
  ('news now daily', 'NND 12p-4p', 'show', 0.99, 'Locked mapping'),
  ('nbc news now', 'NND 12p-4p', 'show', 0.9, 'Network-level phrase default'),
  ('nnn', 'NND 12p-4p', 'show', 0.9, 'Locked mapping'),
  ('sr', 'Specials Standby', 'show', 0.99, 'Locked mapping'),
  ('specials', 'Specials Standby', 'show', 0.95, 'Locked mapping'),
  ('tdy', 'Today Show', 'show', 0.99, 'Locked mapping'),
  ('technical director', 'TD', 'role', 0.99, 'Role synonym'),
  ('technical directors', 'TD', 'role', 0.95, 'Plural role synonym'),
  ('audio engineer', 'A1', 'role', 0.95, 'Role synonym'),
  ('audio 1', 'A1', 'role', 0.99, 'Role synonym'),
  ('gfx operator', 'GFX Op', 'role', 0.95, 'Role synonym'),
  ('video operator', 'V1', 'role', 0.9, 'Role synonym')
on conflict do nothing;
