-- Add subscription & plans to 'users' table (since they are in auth.users, we might need a public 'profiles' table or extend auth.users view? No, auth.users is private)
-- Actually, we don't have a public 'users' table yet? Usually we create 'profiles'.
-- Let's check existing schema first. If no 'users' table exists outside auth, we create 'profiles'.

-- Creating a 'profiles' table that syncs with auth.users is standard Supabase practice.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  subscription_plan text default 'free', -- 'free', 'starter', 'growth', 'business'
  subscription_status text default 'active', -- 'active', 'past_due', 'canceled'
  period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Secure the table
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add 'alias' to qr_codes
alter table public.qr_codes 
add column if not exists alias text unique;

-- Index for fast lookup by alias
create index if not exists qr_codes_alias_idx on public.qr_codes (alias);

-- Policy to allow public read of alias (needed for redirect)
-- Existing policy on qr_codes might be 'auth.uid() = user_id'. We need public read for redirection.
-- Let's check existing policies. If strictly private, we need a function or open policy for SELECT by short_code/alias.

-- Allow public read access to qr_codes for redirection purposes (target_url, alias, short_code)
create policy "Public can view basic QR info" on public.qr_codes
  for select using (true); 
-- Note: This exposes all QR codes. Ideally only minimal columns, but RLS applies to rows. 
-- For MVP SaaS, public usually need to read the redirect target.
