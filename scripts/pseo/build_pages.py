from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

from sklearn.cluster import DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer

from utils import faq_json_ld, load_seeds, make_faq, render_page, slugify

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE_PATH = ROOT / "templates" / "pseo.html"
OUTPUT_DIR = ROOT / "blog"


def hash_str(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def format_seed_heading(seed: str) -> str:
    words = seed.split()
    formatted: list[str] = []
    for word in words:
        lower = word.lower()
        if lower == "qr":
            formatted.append("QR")
        elif lower in {"vcard", "v-card"}:
            formatted.append("vCard")
        elif lower == "vcf":
            formatted.append("VCF")
        else:
            formatted.append(lower.capitalize())
    return " ".join(formatted)


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
        (
            f"Start by opening our generator on the home page, add your contact information, and press Generate to instantly create the {seed}."
        ),
        (
            f"Test the {seed} with multiple phones before you print or share it. Keep a white quiet zone and high contrast so cameras lock on quickly."
        ),
        (
            f"When embedding the {seed} in email signatures or PDFs, export the PNG at a generous resolution and avoid stretching the square image."
        ),
        (
            f"If your details change, create a new {seed} and replace the old asset wherever it lives to keep networking experiences consistent."
        ),
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


def main() -> None:
    eps = float(os.getenv("PSEO_EPS", "0.6"))
    min_samples = int(os.getenv("PSEO_MIN_SAMPLES", "2"))
    dry_run = os.getenv("PSEO_DRY_RUN", "0") == "1"

    seeds = load_seeds()
    if not seeds:
        print("No seeds available after filtering.")
        return

    print(f"Loaded {len(seeds)} seeds")

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
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    created = updated = skipped = 0

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

    print(
        json.dumps(
            {
                "created": created,
                "updated": updated,
                "skipped": skipped,
                "total": len(seeds),
                "clusters": cluster_count,
            }
        )
    )


if __name__ == "__main__":
    main()

