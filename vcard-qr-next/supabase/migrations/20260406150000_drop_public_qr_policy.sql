-- Drop the permissive policy that allows anyone to select all qr_codes
drop policy if exists "Public can read QR codes for redirect" on public.qr_codes;
