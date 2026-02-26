-- Create a table for pSEO pages
create table if not exists public.seo_pages (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  category text not null default 'industries', -- 'industries', 'alternatives', etc.
  title text not null,
  h1 text not null,
  description text not null,
  profession text,
  city text,
  content jsonb, -- For flexible content like FAQs, features, etc.
  keywords text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.seo_pages enable row level security;

-- Public can read SEO pages
create policy "Public can view SEO pages" on public.seo_pages
  for select using (true);

-- Indexes for performance
create index seo_pages_slug_idx on public.seo_pages (slug);
create index seo_pages_category_idx on public.seo_pages (category);
