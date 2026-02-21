-- Add vcard_data column to store JSON vCard info
alter table public.qr_codes
add column if not exists vcard_data jsonb;

-- Create GIN index for faster JSON querying
create index if not exists qr_codes_vcard_data_idx on public.qr_codes using gin (vcard_data);
