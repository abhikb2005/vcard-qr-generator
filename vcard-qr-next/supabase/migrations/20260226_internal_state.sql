-- Create a table for internal application state/metadata
CREATE TABLE IF NOT EXISTS public.internal_state (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.internal_state ENABLE ROW LEVEL SECURITY;

-- Service role only (internal use)
CREATE POLICY "Service role only access" 
ON public.internal_state 
FOR ALL 
USING (true) 
WITH CHECK (true);
