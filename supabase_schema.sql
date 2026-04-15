-- Run this in your Supabase SQL editor (supabase.com → project → SQL Editor)

create table if not exists assignments (
  id          uuid default gen_random_uuid() primary key,
  desk_number integer not null check (desk_number >= 1 and desk_number <= 93),
  person_name text not null,
  time_slot   text not null check (time_slot in ('full_day','morning','afternoon_evening','day','evening','afternoon','late_evening')),
  start_date  date not null,
  end_date    date not null,
  notes       text,
  created_at  timestamptz default now()
);

-- Index for fast lookups by desk and date range
create index if not exists idx_assignments_desk on assignments(desk_number);
create index if not exists idx_assignments_dates on assignments(start_date, end_date);
