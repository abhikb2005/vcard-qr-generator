
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

Google Autocomplete keyword expander for pSEO (free, no API key).

- Reads seed keywords from /keywords/seeds.txt
- Expands with modifiers and A–Z tails
- Calls Google's suggest endpoint across chosen locales
- Stores results in /data/suggestions.csv with dedupe
- Designed for GitHub Actions nightly runs (no secrets needed)

Flags for testing:
  --dry-run           Print preview, don't write CSV
  --limit-seeds N     Process only first N seeds
  --limit-variants N  Use only first N query variants per seed

import argparse
import csv, json, os, random, re, sys, time
from datetime import datetime
from urllib.parse import quote_plus
import urllib.request

# -------- Config --------
LANGS = ["en"]
COUNTRIES = ["US"]  # no country-specific pages for now
REQUESTS_PER_SECOND = 1.0
JITTER = (0.05, 0.25)  # seconds between requests (politeness)

# Keep suggestions that are sufficiently long-tail
MIN_WORDS = 3

# Modifiers expand intent surfaces
MODIFIERS_PREFIX = [
  "how to", "what is", "best", "free", "online", "generator",
  "for", "vs", "iphone", "android", "outlook", "gmail", "whatsapp",
  "with logo", "download", "example", "template"
]

# Audience niches for programmatic coverage
AUDIENCES = [
  "real estate agents","wedding invites","coaches","dentists","lawyers",
  "photographers","consultants","restaurants","freelancers","startups"
]

# A–Z tail expansion (captures long-tails)
TAIL_CHARS = list("abcdefghijklmnopqrstuvwxyz")

# Relevance guard: keep only suggestions with these keywords
KEEP_RE = re.compile(r"\b(vcard|qr|vcf|mecard|contact)\b", re.I)

# Files (repo-relative)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEEDS_PATH = os.path.join(ROOT, "keywords", "seeds.txt")
OUT_DIR = os.path.join(ROOT, "data")
OUT_CSV = os.path.join(OUT_DIR, "suggestions.csv")


def sleep_rl():
  time.sleep(max(0.0, 1.0/REQUESTS_PER_SECOND) + random.uniform(*JITTER))


def fetch_suggestions(query, hl="en", gl="US") -> list:
  """Return list of suggestion strings from Google's endpoint.
  Response format is typically: [query, [sug1, sug2, ...], [], {meta...}]"""
  url = f"https://suggestqueries.google.com/complete/search?client=firefox&hl={hl}&gl={gl}&q={quote_plus(query)}"
  req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
  with urllib.request.urlopen(req, timeout=10) as r:
    data = r.read().decode("utf-8", errors="ignore")
  try:
    arr = json.loads(data)
    if isinstance(arr, list) and len(arr) >= 2 and isinstance(arr[1], list):
      return arr[1]
  except Exception:
    pass
  return []


def normalize(s: str) -> str:
  s = s.strip()
  s = re.sub(r"\s+", " ", s)
  return s


def word_count(s: str) -> int:
  return len(s.split())


def read_seeds():
  if not os.path.exists(SEEDS_PATH):
    print(f"[WARN] seeds file not found: {SEEDS_PATH}")
    return []
  with open(SEEDS_PATH, "r", encoding="utf-8") as f:
    return [normalize(x) for x in f.read().splitlines() if x.strip()]


def load_existing():
  rows = []
  seen = set()
  if os.path.exists(OUT_CSV):
    with open(OUT_CSV, "r", encoding="utf-8", newline="") as f:
      reader = csv.DictReader(f)
      for r in reader:
        rows.append(r)
        seen.add(r.get("suggestion", "").lower())
  return rows, seen


def write_rows(all_rows):
  # ensure unique by suggestion (lowercase)
  seen = set()
  deduped = []
  for r in all_rows:
    key = r["suggestion"].lower()
    if key not in seen:
      seen.add(key)
      deduped.append(r)
  deduped.sort(key=lambda r: r["suggestion"])
  os.makedirs(OUT_DIR, exist_ok=True)
  with open(OUT_CSV, "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=[
      "suggestion","seed","variant","locale","rank","ts"
    ])
    w.writeheader()
    w.writerows(deduped)


def main():
  parser = argparse.ArgumentParser(description="Google Autocomplete expander (free)." )
  parser.add_argument("--limit-seeds", type=int, default=0, help="Process only the first N seeds.")
  parser.add_argument("--limit-variants", type=int, default=0, help="Use only the first N query variants per seed.")
  parser.add_argument("--dry-run", action="store_true", help="Do not write CSV; just print a preview.")
  args = parser.parse_args()

  seeds = read_seeds()
  if args.limit_seeds > 0:
    seeds = seeds[:args.limit_seeds]
  if not seeds:
    print("No seeds found. Add seeds to /keywords/seeds.txt")
    return 0

  existing_rows, seen = load_existing()
  out_rows = existing_rows[:]
  ts = datetime.utcnow().isoformat(timespec="seconds") + "Z"
  total_new = 0

  for seed in seeds:
    base_variants = [seed]

    # Modifiers (prefix)
    for m in MODIFIERS_PREFIX:
      if m == "for":
        for aud in AUDIENCES:
          base_variants.append(f"{seed} for {aud}")
      else:
        base_variants.append(f"{m} {seed}")

    # Tail A–Z
    for c in TAIL_CHARS:
      base_variants.append(f"{seed} {c}")

    if args.limit_variants > 0:
      base_variants = base_variants[:args.limit_variants]

    for hl in LANGS:
      for gl in COUNTRIES:
        for q in base_variants:
          sleep_rl()
          suggestions = fetch_suggestions(q, hl=hl, gl=gl)
          for rank, s in enumerate(suggestions):
            s_norm = normalize(s)
            if not s_norm:
              continue
            # keep only relevant and sufficiently long-tail
            if word_count(s_norm) < MIN_WORDS:
              continue
            if not KEEP_RE.search(s_norm):
              continue
            key = s_norm.lower()
            if key in seen:
              continue
            out_rows.append({
              "suggestion": s_norm,
              "seed": seed,
              "variant": q,
              "locale": f"{hl}-{gl}",
              "rank": str(rank),
              "ts": ts
            })
            seen.add(key)
            total_new += 1

  if args.dry_run:
    print(f"[DRY-RUN] Would write {len(out_rows)} rows; preview of last few:")
    for r in out_rows[-min(10, len(out_rows)): ]:
      print("  •", r["suggestion"], "| seed:", r["seed"], "| variant:", r["variant"], "|", r["locale"])
  else:
    write_rows(out_rows)
    print(f"Wrote CSV to {OUT_CSV}. New suggestions added: {total_new}. Total rows: {len(out_rows)}")
  return 0


if __name__ == "__main__":
  sys.exit(main())
