-- Add a composite index to optimize the IP-based rate limiting query
create index if not exists scans_rate_limit_idx on public.scans (qr_id, ip_address, scanned_at);
