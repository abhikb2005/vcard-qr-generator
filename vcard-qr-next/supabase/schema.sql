-- Create a table for QR Codes
create table if not exists public.qr_codes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  short_code text unique not null,
  target_url text not null,
  name text,
  scan_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.qr_codes enable row level security;

-- Create policies for QR Codes
create policy "Users can view their own QR codes" 
  on public.qr_codes for select 
  using (auth.uid() = user_id);

create policy "Users can create their own QR codes" 
  on public.qr_codes for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own QR codes" 
  on public.qr_codes for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own QR codes" 
  on public.qr_codes for delete 
  using (auth.uid() = user_id);

-- Create a table for Scans (Analytics)
create table if not exists public.scans (
  id uuid default gen_random_uuid() primary key,
  qr_id uuid references public.qr_codes not null,
  ip_address text,
  user_agent text,
  referer text,
  city text,
  country text,
  device_type text,
  scanned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Scans
alter table public.scans enable row level security;

-- Users can view scans for their own QR codes
create policy "Users can view scans for their own QR codes" 
  on public.scans for select 
  using (
    exists (
      select 1 from public.qr_codes 
      where qr_codes.id = scans.qr_id 
      and qr_codes.user_id = auth.uid()
    )
  );

-- Allow public insertion of scans (for the redirect logic) - but restricted via RLS?
-- Actually, the redirect logic runs server-side with service_role typically, 
-- or we can allow public insert if we want client-side tracking (less secure).
-- Better: Server-side tracking. We will use service_role in the API route, so RLS doesn't block it.
-- But for safety, let's allow inserts if the QR exists.
create policy "Server can insert scans" 
  on public.scans for insert 
  with check (true); 

-- Indexes for performance
create index qr_codes_user_id_idx on public.qr_codes (user_id);
create index qr_codes_short_code_idx on public.qr_codes (short_code);
create index scans_qr_id_idx on public.scans (qr_id);
