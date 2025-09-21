from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Iterable

from jinja2 import Template

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
TEMPLATE_DIR = ROOT / "templates"

DOMAIN_TOKENS = ("vcard", "contact", "business", "phone", "email", "address", "vcf")

FALLBACK = [
    "vcard qr code generator",
    "vcard qr code",
    "contact qr code generator",
    "business card qr code generator",
    "qr code contact card",
    "digital business card generator",
    "free digital business card",
    "vcf generator",
    "electronic business card",
    "digital visiting card generator",
]

SUPPLEMENTAL = [
    "vcard qr code download guide",
    "qr code business contact tips",
    "phone contact qr code how to",
    "email vcard qr code generator",
    "address qr code business card",
    "qr vcard for networking events",
    "business qr code contactless card",
    "qr code vcf contact file",
    "vcard qr code best practices",
    "contact qr code printing guide",
]


def normalize(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"\bv\s*card\b", "vcard", s)
    s = re.sub(r"[^a-z0-9\s-]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def slugify(s: str) -> str:
    s = normalize(s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    s = re.sub(r"-+", "-", s)
    return s


def _dedupe_preserve(items: Iterable[str]) -> list[str]:
    seen: dict[str, None] = {}
    for item in items:
        if item not in seen:
            seen[item] = None
    return list(seen.keys())


def filter_relevant(words: Iterable[str]) -> list[str]:
    keep: list[str] = []
    for w in words:
        n = normalize(w)
        if not n:
            continue
        if "qr" in n and any(tok in n for tok in DOMAIN_TOKENS):
            keep.append(n)
    return _dedupe_preserve(keep)


def load_txt_lines(path: Path) -> list[str]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        return [line.strip() for line in handle if line.strip()]


def load_csv_col(path: Path) -> list[str]:
    if not path.exists():
        return []
    values: list[str] = []
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        header = next(reader, None)
        for row in reader:
            if not row:
                continue
            values.append(row[0])
    return values


def ensure_minimum_seeds(seeds: list[str], minimum: int = 10) -> list[str]:
    if len(seeds) >= minimum:
        return seeds
    extras = filter_relevant(SUPPLEMENTAL)
    combined = seeds + [s for s in extras if s not in seeds]
    if len(combined) >= minimum:
        return combined
    # fall back to full combined list even if still short
    return combined


def load_seeds() -> list[str]:
    seeds_csv = DATA / "pseo_seeds.csv"
    txt_fallback = ROOT / "vCard QR code generator keywords.txt"

    if seeds_csv.exists():
        raw = load_csv_col(seeds_csv)
    elif txt_fallback.exists():
        raw = load_txt_lines(txt_fallback)
    else:
        raw = FALLBACK[:]

    normalized = [normalize(s) for s in raw if s and s.strip()]
    normalized = _dedupe_preserve(normalized)
    filtered = filter_relevant(normalized)
    filtered = ensure_minimum_seeds(filtered)

    DATA.mkdir(parents=True, exist_ok=True)
    if not seeds_csv.exists():
        with seeds_csv.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(["keyword"])
            for seed in filtered:
                writer.writerow([seed])

    return filtered


def render_page(template_path: Path, context: dict) -> str:
    template = Template(template_path.read_text(encoding="utf-8"))
    return template.render(**context)


def make_faq(seed: str) -> list[dict[str, str]]:
    cleaned = seed.strip()
    faq = [
        {
            "q": f"How do I create a {cleaned}?",
            "a": "Enter your contact details into the generator, click Generate, and download the PNG right away.",
        },
        {
            "q": f"Can I print a {cleaned} on my business card?",
            "a": "Yes. Print it at 300 DPI with a clear quiet zone and test with both iOS and Android devices.",
        },
        {
            "q": f"Is using a {cleaned} secure?",
            "a": "Our vCard QR generator works entirely in your browser, so your contact data never leaves your device.",
        },
    ]
    return faq


def faq_json_ld(faq_list: list[dict[str, str]]) -> str:
    return json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": qa["q"],
                    "acceptedAnswer": {"@type": "Answer", "text": qa["a"]},
                }
                for qa in faq_list
            ],
        },
        ensure_ascii=False,
        indent=2,
    )

