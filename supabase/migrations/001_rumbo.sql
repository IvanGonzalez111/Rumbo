create table if not exists public.rumbo_users (
  id text primary key,
  email text not null unique,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.rumbo_trips (
  id text primary key,
  user_id text not null references public.rumbo_users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.rumbo_missions (
  id text primary key,
  trip_id text not null references public.rumbo_trips(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.rumbo_stamps (
  id text primary key,
  trip_id text not null references public.rumbo_trips(id) on delete cascade,
  mission_id text,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.rumbo_travel_logs (
  id text primary key,
  trip_id text not null references public.rumbo_trips(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.rumbo_sessions (
  id text primary key,
  user_id text not null references public.rumbo_users(id) on delete cascade,
  expires_at timestamptz not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists rumbo_trips_user_id_idx on public.rumbo_trips(user_id);
create index if not exists rumbo_missions_trip_id_idx on public.rumbo_missions(trip_id);
create index if not exists rumbo_stamps_trip_id_idx on public.rumbo_stamps(trip_id);
create index if not exists rumbo_travel_logs_trip_id_idx on public.rumbo_travel_logs(trip_id);
create index if not exists rumbo_sessions_user_id_idx on public.rumbo_sessions(user_id);
create index if not exists rumbo_sessions_expires_at_idx on public.rumbo_sessions(expires_at);

alter table public.rumbo_users enable row level security;
alter table public.rumbo_trips enable row level security;
alter table public.rumbo_missions enable row level security;
alter table public.rumbo_stamps enable row level security;
alter table public.rumbo_travel_logs enable row level security;
alter table public.rumbo_sessions enable row level security;

revoke all on public.rumbo_users from anon, authenticated;
revoke all on public.rumbo_trips from anon, authenticated;
revoke all on public.rumbo_missions from anon, authenticated;
revoke all on public.rumbo_stamps from anon, authenticated;
revoke all on public.rumbo_travel_logs from anon, authenticated;
revoke all on public.rumbo_sessions from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rumbo-evidence',
  'rumbo-evidence',
  false,
  41943040,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
