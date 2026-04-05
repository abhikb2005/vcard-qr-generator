alter table public.profiles 
  add column if not exists subscription_status text default 'inactive';
