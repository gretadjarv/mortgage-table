create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_sum numeric(14,2) not null check (start_sum >= 0),
  interest_rate numeric(6,3) not null check (interest_rate >= 0),
  amortization numeric(14,2) not null check (amortization >= 0),
  start_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loan_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  updated_amortization numeric(14,2) not null check (updated_amortization >= 0),
  updated_interest_rate numeric(6,3) not null check (updated_interest_rate >= 0),
  update_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.one_time_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.loan_balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loan_id uuid not null references public.loans(id) on delete cascade,
  balance numeric(14,2) not null check (balance >= 0),
  adjustment_date date not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.loans enable row level security;
alter table public.loan_updates enable row level security;
alter table public.one_time_payments enable row level security;
alter table public.loan_balance_adjustments enable row level security;

-- These policies are intentionally conditional so this file can be re-run.
do $$ begin
  create policy "Users can manage their own loans" on public.loans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can manage their own loan updates" on public.loan_updates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can manage their own one-time payments" on public.one_time_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can manage their own balance adjustments" on public.loan_balance_adjustments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
