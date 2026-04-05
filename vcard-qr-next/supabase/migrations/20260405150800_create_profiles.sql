-- Create a table for Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  subscription_plan text default 'free',
  period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Also add the missing public read policy for QR codes
create policy "Public can read QR codes for redirect" 
  on public.qr_codes for select 
  using (true);
