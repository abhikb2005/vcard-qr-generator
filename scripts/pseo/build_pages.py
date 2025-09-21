from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from sklearn.cluster import DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer

from utils import faq_json_ld, load_seeds, make_faq, render_page, slugify

# Paths
ROOT = Path(__file__).resolve().parents[2]
TEMPLATE_PATH = ROOT / "templates" / "pseo.html"
OUTPUT_DIR = ROOT / "blog"
MANIFEST_PATH = ROOT / "blog_index.json"

# --- helpers: content hashing -------------------------------------------------
def hash_str(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

# --- helpers: titles/desc parsing from generated HTML -------------------------
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
META_DESC_RE = re.compile(
    r"<meta[^>]*name=[\"']description[\"'][^>]*content=[\"'](.*?)[\"']",
    re.IGNORECASE | re.DOTALL,
)

def _parse_html_metadata(html: str) -> Dict[str, str]:
    """Extract <title> and meta description from HTML."""
    title_match = TITLE_RE.search(html)
    desc_match = META_DESC_RE.search(html)
    title = title_match.group(1).strip() if title_match else "Untitled"
    description = desc_match.group(1).strip() if desc_match else ""
    return {"title": title, "description": description}

# --- helpers: seed -> nice heading -------------------------------------------
def format_seed_heading(seed: str) -> str:
    words = seed.split()
    formatted: List[str] = []
    for w in words:
        lower = w.lower()
        if lower == "qr":
            formatted.append("QR")
        elif lower in {"vcard", "v-card"}:
            formatted.append("vCard")
        elif lower == "vcf":
            formatted.append("VCF")
        else:
            formatted.append(lower.capitalize())
    return " ".join(formatted)

# --- page context -------------------------------------------------------------
def build_context(seed: str, slug: str) -> dict:
    heading = format_seed_heading(seed)
    title = f"{heading} — Free vCard QR Code Guide"
    description = (
        f"Learn how to create and share a {seed} safely with free tools, troubleshooting tips, printing advice, and privacy best practices."
    )
    intro = " ".join(
        [
            f"This page walks you through building a {seed} in minutes so every scan delivers the right contact details.",
            "Follow our preparation checklist, testing advice, and sharing ideas to make the QR easy to use online or offline.",
            "You will also get printing and privacy tips so your contact card keeps working long after the first scan.",
        ]
    )
    paragraphs = [
        f"Start by opening our generator on the home page, add your contact information, and press Generate to instantly create the {seed}.",
        f"Test the {seed} with multiple phones before you print or share it. Keep a white quiet zone and high contrast so cameras lock on quickly.",
        f"When embedding the {seed} in email signatures or PDFs, export the PNG at a generous resolution and avoid stretching the square image.",
        f"If your details change, create a new {seed} and replace the old asset wherever it lives to keep networking experiences consistent.",
    ]
    faq_items = make_faq(seed)
    faq_json = faq_json_ld(faq_items)

    return {
        "title": title,
        "description": description,
        "h1": title,
        "intro": intro,
        "paragraphs": paragraphs,
        "seed": seed,
        "slug": slug,
        "faq_json": faq_json,
    }

# --- manifest utilities -------------------------------------------------------
def _load_existing_manifest() -> Dict[str, Dict[str, str]]:
    """Load existing blog_index.json as dict keyed by slug."""
    if not MANIFEST_PATH.exists():
        return {}
    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    result: Dict[str, Dict[str, str]] = {}
    if isinstance(data, list):
        for entry in data:
            if isinstance(entry, dict) and isinstance(entry.get("slug"), str):
                result[entry["slug"]] = entry
    return result

def _iso_today() -> str:
    return datetime.now(timezone.utc).date().isoformat()

def _scan_blog_dir_for_posts() -> List[Dict[str, str]]:
    """Scan /blog/*/index.html and extract slug, title, description, url."""
    posts: List[Dict[str, str]] = []
    if not OUTPUT_DIR.exists():
        return posts
    for child in sorted(OUTPUT_DIR.iterdir()):
        if not child.is_dir():
            continue
        slug = child.name
        index_file = child / "index.html"
        if not index_file.exists():
            continue
        try:
            html = index_file.read_text(encoding="utf-8")
        except OSError:
            continue
        meta = _parse_html_metadata(html)
        posts.append({
            "slug": slug,
            "title": meta.get("title") or slug.replace("-", " ").title(),
            "description": meta.get("description", "") or "",
            "url": f"/blog/{slug}/",
        })
    return posts

def _merge_manifest(existing: Dict[str, Dict[str, str]], scanned: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Upsert scanned posts into manifest, preserving original dates."""
    today = _iso_today()
    merged: Dict[str, Dict[str, str]] = {}

    # start with existing
    for slug, entry in existing.items():
        merged[slug] = {
            "slug": slug,
            "title": entry.get("title") or slug.replace("-", " ").title(),
            "description": entry.get("description") or "",
            "url": entry.get("url") or f"/blog/{slug}/",
            "date": entry.get("date") or today,
        }

    # upsert scanned (preserve older/original date)
    for p in scanned:
        slug = p["slug"]
        cur = merged.get(slug)
        date = cur["date"] if cur and cur.get("date") else today
        merged[slug] = {
            "slug": slug,
            "title": p.get("title") or (cur.get("title") if cur else slug.replace("-", " ").title()),
            "description": p.get("description") or (cur.get("description") if cur else ""),
            "url": p.get("url") or (cur.get("url") if cur else f"/blog/{slug}/"),
            "date": date,
        }

    # sort by date desc (unknown/invalid last)
    def _ts(v: Optional[str]) -> float:
        try:
            return datetime.fromisoformat(v).timestamp() if v else float("-inf")
        except Exception:
            return float("-inf")

    out = sorted(merged.values(), key=lambda d: _ts(d.get("date")), reverse=True)
    return out

def _write_manifest(entries: List[Dict[str, str]]) -> None:
    MANIFEST_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# --- main ---------------------------------------------------------------------
def main() -> None:
    eps = float(os.getenv("PSEO_EPS", "0.6"))
    min_samples = int(os.getenv("PSEO_MIN_SAMPLES", "2"))
    dry_run = os.getenv("PSEO_DRY_RUN", "0") == "1"

    seeds = load_seeds()
    if not seeds:
        print("No seeds available after filtering.")
        return

    print(f"Loaded {len(seeds)} seeds")

    # clustering (kept for parity / debugging)
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    matrix = vectorizer.fit_transform(seeds)
    clustering = DBSCAN(metric="cosine", eps=eps, min_samples=min_samples)
    labels = clustering.fit_predict(matrix)
    cluster_count = len({label for label in labels if label >= 0})
    print(f"DBSCAN clusters: {cluster_count} (eps={eps}, min_samples={min_samples})")

    slugs = [slugify(seed) for seed in seeds]

    if dry_run:
        sample = ", ".join(slugs[:5]) if slugs else ""
        print("Dry run summary:")
        print(f"  Seeds: {len(seeds)}")
        print(f"  Clusters: {cluster_count}")
        print(f"  Sample slugs: {sample}")
        # Also dry-run manifest scan
        existing = _load_existing_manifest()
        scanned = _scan_blog_dir_for_posts()
        merged = _merge_manifest(existing, scanned)
        print(f"  Manifest (dry): {len(merged)} entries after merge")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    created = updated = skipped = 0

    # Generate/update pages
    for seed, slug in zip(seeds, slugs):
        context = build_context(seed, slug)
        html = render_page(TEMPLATE_PATH, context)

        page_dir = OUTPUT_DIR / slug
        page_dir.mkdir(parents=True, exist_ok=True)
        page_file = page_dir / "index.html"

        new_hash = hash_str(html)
        existing_hash = None
        if page_file.exists():
            existing_hash = hash_str(page_file.read_text(encoding="utf-8", errors="ignore"))

        if existing_hash == new_hash:
            skipped += 1
            continue

        page_file.write_text(html, encoding="utf-8")
        if existing_hash is None:
            created += 1
        else:
            updated += 1

    # Build/refresh manifest AFTER pages exist on disk
    existing_manifest = _load_existing_manifest()
    scanned_posts = _scan_blog_dir_for_posts()
    merged_manifest = _merge_manifest(existing_manifest, scanned_posts)
    _write_manifest(merged_manifest)

    print(
        json.dumps(
            {
                "created": created,
                "updated": updated,
                "skipped": skipped,
                "total": len(seeds),
                "clusters": cluster_count,
                "manifest_entries": len(merged_manifest),
            }
        )
    )

if __name__ == "__main__":
    main()
