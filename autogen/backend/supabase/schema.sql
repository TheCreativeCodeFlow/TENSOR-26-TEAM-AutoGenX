-- Run this in Supabase SQL Editor before testing OTP endpoints.
-- If this is not executed, /auth/otp/request will return an error and no OTP will be sent.

create extension if not exists pgcrypto;

create table if not exists public.fisher_users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  full_name text,
  role text not null default 'fisherfolk',
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fishing_zones (
  id text primary key,
  name text not null,
  state text,
  center jsonb not null,
  polygon jsonb not null,
  max_safe_wave_height_m numeric(5,2) not null,
  max_safe_wind_kmph numeric(5,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.fishing_zones (id, name, state, center, polygon, max_safe_wave_height_m, max_safe_wind_kmph)
values
  (
    'zone-palk-01',
    'Palk Strait Nearshore',
    'Tamil Nadu',
    '{"lat":9.62,"lng":79.31}'::jsonb,
    '[[9.68,79.19],[9.78,79.38],[9.53,79.47],[9.47,79.24]]'::jsonb,
    1.50,
    28.00
  ),
  (
    'zone-mannar-01',
    'Gulf of Mannar Shelf',
    'Tamil Nadu',
    '{"lat":8.91,"lng":78.29}'::jsonb,
    '[[8.98,78.12],[9.03,78.36],[8.81,78.43],[8.76,78.18]]'::jsonb,
    1.80,
    32.00
  ),
  (
    'zone-odisha-01',
    'Gopalpur Coast',
    'Odisha',
    '{"lat":19.27,"lng":84.91}'::jsonb,
    '[[19.36,84.81],[19.39,84.99],[19.20,85.04],[19.13,84.85]]'::jsonb,
    1.60,
    30.00
  )
on conflict (id) do update set
  name = excluded.name,
  state = excluded.state,
  center = excluded.center,
  polygon = excluded.polygon,
  max_safe_wave_height_m = excluded.max_safe_wave_height_m,
  max_safe_wind_kmph = excluded.max_safe_wind_kmph,
  updated_at = now();

create table if not exists public.fisher_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text not null,
  age int not null,
  coastal_area text not null,
  primary_zone_id text,
  location_label text not null,
  latitude numeric(10,6) not null,
  longitude numeric(10,6) not null,
  language text not null,
  boat_type text not null,
  phone text not null,
  safety_phone text,
  village text,
  district text,
  state text,
  pincode text,
  emergency_contact_name text,
  emergency_contact_phone text,
  relationship text,
  years_of_experience int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fisher_profiles_zone_fk foreign key (primary_zone_id) references public.fishing_zones(id),
  constraint fisher_profiles_user_fk foreign key (user_id) references public.fisher_users(id)
);

create index if not exists fisher_profiles_user_id_idx on public.fisher_profiles (user_id);

create table if not exists public.sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  fisher_name text,
  vessel_id text,
  safety_phone text,
  location_label text,
  coast_guard_number text,
  zone_id text not null,
  location jsonb not null,
  message text,
  distress_type text,
  escalation_plan jsonb,
  dispatch jsonb,
  status text not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sos_events_user_fk foreign key (user_id) references public.fisher_users(id)
);

create index if not exists sos_events_user_id_idx on public.sos_events (user_id);
create index if not exists sos_events_status_idx on public.sos_events (status);
create index if not exists sos_events_created_at_idx on public.sos_events (created_at desc);

create table if not exists public.fisher_auth_metadata (
  user_id uuid primary key,
  email text,
  phone text,
  provider text,
  last_sign_in_at timestamptz,
  last_seen_at timestamptz not null default now(),
  raw_user jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fisher_auth_metadata_user_fk foreign key (user_id) references public.fisher_users(id)
);

create index if not exists fisher_auth_metadata_last_seen_idx on public.fisher_auth_metadata (last_seen_at desc);
