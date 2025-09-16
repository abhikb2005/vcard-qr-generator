
# Google Autocomplete Pipeline (Free) — pSEO

This adds a nightly, zero-cost keyword expansion pipeline using Google's autocomplete suggestions.

## Files
- `scripts/autocomplete.py` — expands seeds and fetches suggestions into `data/suggestions.csv`
- `keywords/seeds.txt` — one seed per line (edit this)
- `.github/workflows/fetch_suggestions.yml` — runs nightly and on-demand

## Test locally
```bash
python3 scripts/autocomplete.py --limit-seeds 1 --limit-variants 8 --dry-run
# then a real write:
python3 scripts/autocomplete.py --limit-seeds 1 --limit-variants 8
```

## How it works
- Builds variants via modifiers + A–Z tails
- Fetches suggestions via `suggestqueries.google.com` with polite rate-limit
- Keeps only relevant (vcard/qr/vcf/mecard/contact) and long-tail (>=3 words)
- Dedupes and commits `data/suggestions.csv` if changed

## Next steps
- Cluster suggestions (e.g., sentence-transformers) to form topics
- Generate Markdown pages per cluster using your content template
- Build with Jekyll/Hugo/11ty; deploy on GitHub/Cloudflare Pages
