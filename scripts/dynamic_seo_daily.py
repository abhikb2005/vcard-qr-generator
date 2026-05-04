from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOG_ROOT = ROOT / "blog"
TRACKER = ROOT / "data" / "dynamic-seo-daily-tracker.md"
QUEUE = ROOT / "data" / "dynamic-seo-directory-queue.md"
DIRECTORY_OUTBOX = ROOT / "data" / "directory-submission-outbox"

APP_URL = "https://app.vcardqrcodegenerator.com/login"
SITE_URL = "https://www.vcardqrcodegenerator.com"

TOPICS = [
    {
        "keyword": "what qr code type for vcard with updates",
        "slug": "what-qr-code-type-for-vcard-with-updates",
        "title": "What QR Code Type Should You Use for a vCard With Updates?",
        "description": "If your vCard details may change after printing, learn whether static or dynamic QR codes are the better fit for business cards and contact sharing.",
    },
    {
        "keyword": "editable vcard qr code",
        "slug": "editable-vcard-qr-code",
        "title": "Editable vCard QR Code: When You Need Dynamic Contact Updates",
        "description": "Editable vCard QR codes let you update contact details after printing. Learn when dynamic contact QR codes are worth using.",
    },
    {
        "keyword": "dynamic qr code generator",
        "slug": "dynamic-qr-code-generator",
        "title": "Dynamic QR Code Generator: Editable QR Codes for Business",
        "description": "Learn how dynamic QR code generators work and when to use editable QR codes for business cards, flyers, signs, menus, and campaigns.",
    },
    {
        "keyword": "dynamic vcard qr code",
        "slug": "dynamic-vcard-qr-code",
        "title": "Dynamic vCard QR Code: Update Contact Details Without Reprinting",
        "description": "A practical guide to dynamic vCard QR codes for business cards, sales teams, recruiters, and events.",
    },
    {
        "keyword": "change qr code after printing",
        "slug": "change-qr-code-after-printing",
        "title": "How to Change a QR Code After Printing",
        "description": "Find out when a QR code can be changed after printing and why dynamic QR codes are the safe option for printed campaigns.",
    },
    {
        "keyword": "reusable qr code",
        "slug": "reusable-qr-code",
        "title": "Reusable QR Code: One Code, Many Future Updates",
        "description": "Reusable QR codes let you keep the same printed code while updating the destination behind it.",
    },
]


def api_status() -> dict[str, str]:
    return {
        "gsc": "available" if (ROOT / "mcp-gsc" / "token.json").exists() else "blocked: no local token",
        "ga4": "available" if os.getenv("GA4_PROPERTY_ID") and os.getenv("GOOGLE_APPLICATION_CREDENTIALS") else "blocked: re-auth required",
        "keyword_planner": "available" if os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN") and os.getenv("GOOGLE_ADS_CUSTOMER_ID") else "blocked: missing Google Ads credentials",
        "adsense": "available" if os.getenv("ADSENSE_ACCOUNT_ID") else "blocked: missing AdSense account/OAuth credentials",
    }


def existing_slugs() -> set[str]:
    return {p.parent.name for p in BLOG_ROOT.glob("*/index.html")}


def pick_topic() -> dict[str, str]:
    slugs = existing_slugs()
    for topic in TOPICS:
        if topic["slug"] not in slugs:
            return topic
    return TOPICS[0]


def escape_json(text: str) -> str:
    return json.dumps(text)[1:-1]


def render_blog(topic: dict[str, str]) -> str:
    today = date.today().isoformat()
    keyword = topic["keyword"]
    title = topic["title"]
    desc = topic["description"]
    slug = topic["slug"]
    canonical = f"{SITE_URL}/blog/{slug}/"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} (2026)</title>
  <meta name="description" content="{desc}" />
  <link rel="canonical" href="{canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:url" content="{canonical}" />
  <script src="/consent.js"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-E90B41BNEH"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-E90B41BNEH');function trackDynamicCta(l){{gtag('event','dynamic_qr_cta_click',{{source_page:'blog/{slug}',cta_location:l,anchor_text:'Try dynamic QR codes'}});}}</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1206702185649949" crossorigin="anonymous"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"Article","headline":"{escape_json(title)}","description":"{escape_json(desc)}","mainEntityOfPage":"{canonical}","author":{{"@type":"Organization","name":"vCard QR Code Generator"}},"publisher":{{"@type":"Organization","name":"vCard QR Code Generator"}},"datePublished":"{today}T00:00:00+00:00","dateModified":"{today}T00:00:00+00:00"}}</script>
  <script type="application/ld+json">{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{{"@type":"Question","name":"What is {escape_json(keyword)}?","acceptedAnswer":{{"@type":"Answer","text":"It is a QR code workflow where the printed QR points to a managed destination that can be updated later."}}}},{{"@type":"Question","name":"When should I use a dynamic QR code?","acceptedAnswer":{{"@type":"Answer","text":"Use dynamic QR codes for printed assets, business cards, campaigns, and places where the destination may change after printing."}}}}]}}</script>
</head>
<body class="bg-slate-50 text-slate-900">
  <header class="bg-gradient-to-r from-indigo-700 to-cyan-600 text-white"><div class="max-w-4xl mx-auto px-6 py-12"><a href="/blogs/" class="underline">&larr; Blog</a><h1 class="mt-6 text-4xl font-bold">{title}</h1><p class="mt-4 text-lg text-white/90">{desc}</p></div></header>
  <main class="max-w-4xl mx-auto px-6 py-12">
    <div class="my-8 min-h-[100px]"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-1206702185649949" data-ad-slot="7438060059" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({{}});</script></div>
    <article class="prose prose-slate max-w-none">
      <p><strong>Quick answer:</strong> {keyword} intent usually means the searcher needs a QR code that can be edited after printing. A static QR code is excellent for permanent data, but a dynamic QR code is safer when the destination may change.</p>
      <h2>Why dynamic QR codes matter</h2>
      <p>Printed QR codes often live longer than the information behind them. Business cards remain in drawers, event badges get photographed, real estate signs stay outside for weeks, and flyers continue circulating after a campaign changes. Dynamic QR codes solve that mismatch by letting the printed pattern stay the same while the destination changes in a dashboard.</p>
      <h2>Best use cases</h2>
      <ul><li>Business cards with changing contact details</li><li>Flyers and posters with campaign links</li><li>Restaurant menus and table tents</li><li>Conference badges and event signs</li><li>Product packaging and warranty pages</li></ul>
      <h2>Static vs dynamic</h2>
      <p>Use the free static vCard QR generator when the details are permanent and privacy-first offline behavior matters most. Use dynamic QR codes when you need editability, a reusable short link, or scan visibility.</p>
      <section class="not-prose rounded-xl bg-indigo-50 border border-indigo-100 p-6"><h2 class="text-2xl font-bold">Create an editable QR code</h2><p class="mt-3">The Dynamic QR dashboard lets you create a QR code once and update the destination later.</p><a href="{APP_URL}" onclick="trackDynamicCta('body')" class="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">Try dynamic QR codes</a></section>
      <h2>Related resources</h2>
      <ul><li><a href="/dynamic-qr-code-generator.html">Dynamic QR Code Generator</a></li><li><a href="/blog/editable-qr-code/">Editable QR Code Guide</a></li><li><a href="/blog/dynamic-vs-static-vcard-qr-codes/">Dynamic vs Static QR Codes</a></li></ul>
    </article>
  </main>
</body>
</html>
"""


def append_tracker(topic: dict[str, str], directory: str, status: dict[str, str]) -> None:
    line = (
        f"| {date.today().isoformat()} | {topic['keyword']} | `/blog/{topic['slug']}/` | "
        f"GSC/local seeds; Keyword Planner {status['keyword_planner']} | {directory} action card prepared | "
        f"Published by automation | Directory submission may require browser login/captcha | Next queue item |\n"
    )
    if not TRACKER.exists():
        TRACKER.parent.mkdir(parents=True, exist_ok=True)
        TRACKER.write_text("# Dynamic SEO Daily Tracker\n\n## Daily Log\n\n| Date | Keyword | Blog URL | Source Data | Directory Action | Status | Blockers | Next Queue Item |\n|---|---|---|---|---|---|---|---|\n", encoding="utf-8")
    text = TRACKER.read_text(encoding="utf-8")
    if f"| {date.today().isoformat()} |" not in text:
        TRACKER.write_text(text.rstrip() + "\n" + line, encoding="utf-8")


def next_directory() -> str:
    if not QUEUE.exists():
        return "Directory queue missing"
    for line in QUEUE.read_text(encoding="utf-8").splitlines():
        if "| Pending |" in line:
            parts = [p.strip() for p in line.strip("|").split("|")]
            if len(parts) >= 2:
                return parts[1]
    return "Directory queue exhausted"


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "directory"


def write_directory_action_card(directory: str, topic: dict[str, str]) -> Path:
    DIRECTORY_OUTBOX.mkdir(parents=True, exist_ok=True)
    path = DIRECTORY_OUTBOX / f"{date.today().isoformat()}-{slugify(directory)}.md"
    if path.exists():
        return path

    path.write_text(
        f"""# Directory Submission Action Card - {date.today().isoformat()}

## Directory

- Name: {directory}
- Status: Pending browser submission
- Browser standard: Microsoft Edge

## Listing Copy

Product: vCard QR Code Generator + Dynamic QR Codes

URL: {SITE_URL}/dynamic-qr-code-generator.html

Short description: Free privacy-first static vCard QR codes plus a paid dynamic QR dashboard for editable QR codes that can be changed after printing.

Long description: vCard QR Code Generator helps professionals create contact-sharing QR codes quickly. The static generator is free and browser-based, while the Dynamic QR dashboard supports editable destinations for business cards, flyers, events, and campaigns that may need updates after printing. Payments use Dodo Payments.

## Submission Rules

- Submit only if the listing is free and relevant.
- Do not pay fees or bypass captchas.
- If login, captcha, or email verification is required, log the blocker and move to the next viable free directory.
- Do not send outreach email without explicit approval.

## Content Tie-In

- Keyword: {topic["keyword"]}
- Blog target: {SITE_URL}/blog/{topic["slug"]}/
- Hub target: {SITE_URL}/dynamic-qr-code-generator.html
""",
        encoding="utf-8",
    )
    return path


def run_update_indexes() -> None:
    subprocess.run([sys.executable, "scripts/pseo/update_sitemap.py"], cwd=ROOT, check=True)


def main() -> None:
    status = api_status()
    topic = pick_topic()
    out_dir = BLOG_ROOT / topic["slug"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "index.html"
    if not out_file.exists():
        out_file.write_text(render_blog(topic), encoding="utf-8")
    directory = next_directory()
    write_directory_action_card(directory, topic)
    append_tracker(topic, directory, status)
    run_update_indexes()
    print(json.dumps({"topic": topic, "api_status": status}, indent=2))


if __name__ == "__main__":
    main()
