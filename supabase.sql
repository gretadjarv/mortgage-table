-- Run this entire file in Supabase SQL Editor.
-- It creates the tables, ownership rules and indexes used by Mortgage Table.

create extension if not exists pgcrypto;

drop table if exists public.one_time_payments cascade;
drop table if exists public.loan_updates cascade;
drop table if exists public.loans cascade;

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  start_sum numeric(14,2) not null check (start_sum >= 0),
  interest_rate numeric(6,3) not null check (interest_rate >= 0),
  amortization numeric(14,2) not null check (amortization >= 0),
  start_date date not null,
  created_at timestamptz not null default now()
);

create table public.loan_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  updated_amortization numeric(14,2) not null check (updated_amortization >= 0),
  updated_interest_rate numeric(6,3) not null check (updated_interest_rate >= 0),
  update_date date not null,
  created_at timestamptz not null default now()
);

create table public.one_time_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null,
  created_at timestamptz not null default now()
);

create index loans_user_id_idx on public.loans(user_id);
create index loan_updates_user_id_idx on public.loan_updates(user_id);
create index loan_updates_loan_date_idx on public.loan_updates(loan_id, update_date);
create index one_time_payments_user_id_idx on public.one_time_payments(user_id);
create index one_time_payments_loan_date_idx on public.one_time_payments(loan_id, payment_date);

alter table public.loans enable row level security;
alter table public.loan_updates enable row level security;
alter table public.one_time_payments enable row level security;

create policy "Users can manage their own loans" on public.loans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own loan updates" on public.loan_updates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own one-time payments" on public.one_time_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
