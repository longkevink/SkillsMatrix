create table if not exists public.control_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.resource_control_room_skills (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  control_room_id uuid not null references public.control_rooms(id) on delete cascade,
  status public.skill_status not null default 'NA',
  notes text,
  updated_at timestamptz not null default now(),
  constraint resource_control_room_skills_resource_id_control_room_id_key unique (resource_id, control_room_id)
);

create index if not exists resource_control_room_skills_control_room_status_idx
  on public.resource_control_room_skills(control_room_id, status);

create index if not exists resource_control_room_skills_resource_status_idx
  on public.resource_control_room_skills(resource_id, status);

drop trigger if exists set_resource_control_room_skills_updated_at on public.resource_control_room_skills;

create trigger set_resource_control_room_skills_updated_at
before update on public.resource_control_room_skills
for each row
execute function public.touch_resource_skills_updated_at();

insert into public.control_rooms (code) values
  ('CR1A'),
  ('CR31'),
  ('CR32'),
  ('CR33'),
  ('CR34'),
  ('CR74'),
  ('CR76')
on conflict (code) do nothing;
