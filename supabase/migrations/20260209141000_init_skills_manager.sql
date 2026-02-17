create extension if not exists pgcrypto;

create type public.skill_status as enum ('Active', 'Refresh', 'Training', 'NA', 'Red');

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  created_at timestamptz not null default now(),
  constraint resources_name_role_key unique (name, role)
);

create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.resource_skills (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  show_id uuid not null references public.shows(id) on delete cascade,
  status public.skill_status not null default 'NA',
  notes text,
  updated_at timestamptz not null default now(),
  constraint resource_skills_resource_id_show_id_key unique (resource_id, show_id)
);

create table if not exists public.backfill_preferences (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows(id) on delete cascade,
  role text not null,
  resource_id uuid not null references public.resources(id) on delete cascade,
  rank integer not null check (rank > 0),
  is_permanent_crew boolean not null default false,
  constraint backfill_preferences_show_role_resource_key unique (show_id, role, resource_id),
  constraint backfill_preferences_show_role_list_rank_key unique (show_id, role, is_permanent_crew, rank)
);

create index if not exists resources_role_idx on public.resources(role);
create index if not exists resource_skills_show_status_idx on public.resource_skills(show_id, status);
create index if not exists resource_skills_resource_status_idx on public.resource_skills(resource_id, status);
create index if not exists backfill_preferences_show_role_list_rank_idx on public.backfill_preferences(show_id, role, is_permanent_crew, rank);

create or replace function public.touch_resource_skills_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_resource_skills_updated_at on public.resource_skills;

create trigger set_resource_skills_updated_at
before update on public.resource_skills
for each row
execute function public.touch_resource_skills_updated_at();

create or replace function public.replace_backfill_preferences(
  input_show_id uuid,
  input_role text,
  permanent_ids uuid[],
  backup_ids uuid[]
)
returns void
language plpgsql
as $$
begin
  delete from public.backfill_preferences
  where show_id = input_show_id
    and role = input_role;

  insert into public.backfill_preferences (show_id, role, resource_id, rank, is_permanent_crew)
  select input_show_id, input_role, item.resource_id, item.rank, true
  from unnest(coalesce(permanent_ids, '{}'::uuid[])) with ordinality as item(resource_id, rank);

  insert into public.backfill_preferences (show_id, role, resource_id, rank, is_permanent_crew)
  select input_show_id, input_role, item.resource_id, item.rank, false
  from unnest(coalesce(backup_ids, '{}'::uuid[])) with ordinality as item(resource_id, rank);
end;
$$;
