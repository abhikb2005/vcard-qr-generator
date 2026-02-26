-- Add publication tracking to seo_pages
ALTER TABLE public.seo_pages 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Index for the autopilot query
CREATE INDEX IF NOT EXISTS seo_pages_is_published_idx ON public.seo_pages (is_published);
