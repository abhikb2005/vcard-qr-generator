from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import date, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BLOG_ROOT = ROOT / "blog"
TRACKER = ROOT / "data" / "dynamic-seo-daily-tracker.md"
QUEUE = ROOT / "data" / "dynamic-seo-directory-queue.md"
DIRECTORY_OUTBOX = ROOT / "data" / "directory-submission-outbox"

APP_URL = "https://app.vcardqrcodegenerator.com/login"
SITE_URL = "https://www.vcardqrcodegenerator.com"
GSC_SITE_URL = os.getenv("GSC_SITE_URL", "sc-domain:vcardqrcodegenerator.com")
GA4_PROPERTY_ID = os.getenv("GA4_PROPERTY_ID", "505092702")

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
    gsc_secret_auth = all(
        os.getenv(name)
        for name in ("GSC_CLIENT_ID", "GSC_CLIENT_SECRET", "GSC_REFRESH_TOKEN")
    )
    ga4_secret_auth = all(
        os.getenv(name)
        for name in ("GA4_CLIENT_ID", "GA4_CLIENT_SECRET", "GA4_REFRESH_TOKEN", "GA4_PROPERTY_ID")
    )
    ads_secret_auth = all(
        os.getenv(name)
        for name in (
            "GOOGLE_ADS_DEVELOPER_TOKEN",
            "GOOGLE_ADS_CUSTOMER_ID",
            "GOOGLE_ADS_CLIENT_ID",
            "GOOGLE_ADS_CLIENT_SECRET",
            "GOOGLE_ADS_REFRESH_TOKEN",
        )
    )
    adsense_secret_auth = all(
        os.getenv(name)
        for name in (
            "ADSENSE_ACCOUNT_ID",
            "ADSENSE_CLIENT_ID",
            "ADSENSE_CLIENT_SECRET",
            "ADSENSE_REFRESH_TOKEN",
        )
    )
    return {
        "gsc": "available" if gsc_secret_auth or (ROOT / "mcp-gsc" / "token.json").exists() else "blocked: no OAuth secrets or local token",
        "ga4": "available" if ga4_secret_auth else "blocked: re-auth required",
        "keyword_planner": "available" if ads_secret_auth else "blocked: missing Google Ads credentials",
        "adsense": "available" if adsense_secret_auth else "blocked: missing AdSense account/OAuth credentials",
    }


def existing_slugs() -> set[str]:
    return {p.parent.name for p in BLOG_ROOT.glob("*/index.html")}


def fetch_gsc_query_rows() -> list[dict[str, Any]]:
    if not all(os.getenv(name) for name in ("GSC_CLIENT_ID", "GSC_CLIENT_SECRET", "GSC_REFRESH_TOKEN")):
        return []

    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
    except ImportError:
        return []

    creds = Credentials(
        token=None,
        refresh_token=os.environ["GSC_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GSC_CLIENT_ID"],
        client_secret=os.environ["GSC_CLIENT_SECRET"],
        scopes=["https://www.googleapis.com/auth/webmasters"],
    )
    creds.refresh(Request())
    service = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
    end = date.today() - timedelta(days=2)
    start = end - timedelta(days=27)
    body = {
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "dimensions": ["query"],
        "rowLimit": 500,
        "type": "web",
    }
    return service.searchanalytics().query(siteUrl=GSC_SITE_URL, body=body).execute().get("rows", [])


def fetch_ga4_landing_rows() -> list[dict[str, Any]]:
    if not all(os.getenv(name) for name in ("GA4_CLIENT_ID", "GA4_CLIENT_SECRET", "GA4_REFRESH_TOKEN", "GA4_PROPERTY_ID")):
        return []

    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, OrderBy, RunReportRequest
    except ImportError:
        return []

    creds = Credentials(
        token=None,
        refresh_token=os.environ["GA4_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GA4_CLIENT_ID"],
        client_secret=os.environ["GA4_CLIENT_SECRET"],
        scopes=["https://www.googleapis.com/auth/analytics.readonly"],
    )
    creds.refresh(Request())
    client = BetaAnalyticsDataClient(credentials=creds)
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        dimensions=[Dimension(name="landingPage")],
        metrics=[
            Metric(name="sessions"),
            Metric(name="activeUsers"),
            Metric(name="engagedSessions"),
            Metric(name="screenPageViews"),
        ],
        date_ranges=[DateRange(start_date="28daysAgo", end_date="yesterday")],
        order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)],
        limit=100,
    )
    response = client.run_report(request)
    rows: list[dict[str, Any]] = []
    for row in response.rows:
        rows.append(
            {
                "landingPage": row.dimension_values[0].value,
                "sessions": float(row.metric_values[0].value or 0),
                "activeUsers": float(row.metric_values[1].value or 0),
                "engagedSessions": float(row.metric_values[2].value or 0),
                "screenPageViews": float(row.metric_values[3].value or 0),
            }
        )
    return rows


def fetch_keyword_ideas(topics: list[dict[str, str]]) -> list[dict[str, Any]]:
    required = (
        "GOOGLE_ADS_DEVELOPER_TOKEN",
        "GOOGLE_ADS_CUSTOMER_ID",
        "GOOGLE_ADS_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET",
        "GOOGLE_ADS_REFRESH_TOKEN",
    )
    if not all(os.getenv(name) for name in required):
        return []

    try:
        from google.ads.googleads.client import GoogleAdsClient
    except ImportError:
        return []

    config = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "use_proto_plus": True,
    }
    if os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID"):
        config["login_customer_id"] = os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"]

    client = GoogleAdsClient.load_from_dict(config)
    idea_service = client.get_service("KeywordPlanIdeaService")
    request = client.get_type("GenerateKeywordIdeasRequest")
    request.customer_id = os.environ["GOOGLE_ADS_CUSTOMER_ID"]
    request.language = "languageConstants/1000"  # English
    request.geo_target_constants.append("geoTargetConstants/2840")  # United States
    request.keyword_plan_network = client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH
    request.keyword_seed.keywords.extend([topic["keyword"] for topic in topics])

    ideas: list[dict[str, Any]] = []
    for idea in idea_service.generate_keyword_ideas(request=request):
        metrics = idea.keyword_idea_metrics
        ideas.append(
            {
                "text": idea.text,
                "avg_monthly_searches": float(metrics.avg_monthly_searches or 0),
                "competition": str(metrics.competition.name),
            }
        )
    return ideas


def fetch_adsense_summary() -> dict[str, Any]:
    required = (
        "ADSENSE_ACCOUNT_ID",
        "ADSENSE_CLIENT_ID",
        "ADSENSE_CLIENT_SECRET",
        "ADSENSE_REFRESH_TOKEN",
    )
    if not all(os.getenv(name) for name in required):
        return {}

    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
    except ImportError:
        return {}

    creds = Credentials(
        token=None,
        refresh_token=os.environ["ADSENSE_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["ADSENSE_CLIENT_ID"],
        client_secret=os.environ["ADSENSE_CLIENT_SECRET"],
        scopes=["https://www.googleapis.com/auth/adsense.readonly"],
    )
    creds.refresh(Request())
    service = build("adsense", "v2", credentials=creds, cache_discovery=False)
    account = os.environ["ADSENSE_ACCOUNT_ID"]
    report = service.accounts().reports().generate(
        account=account,
        dateRange="LAST_7_DAYS",
        metrics=["ESTIMATED_EARNINGS", "IMPRESSIONS", "CLICKS", "PAGE_VIEWS"],
    ).execute()
    headers = [header.get("name") for header in report.get("headers", [])]
    rows = report.get("rows", [])
    values: dict[str, float] = {header: 0.0 for header in headers if header}
    if rows:
        cells = rows[0].get("cells", [])
        for header, cell in zip(headers, cells):
            try:
                values[header] = float(str(cell).replace(",", ""))
            except ValueError:
                values[header] = 0.0

    page_views = values.get("PAGE_VIEWS", 0.0)
    impressions = values.get("IMPRESSIONS", 0.0)
    earnings = values.get("ESTIMATED_EARNINGS", 0.0)
    clicks = values.get("CLICKS", 0.0)
    return {
        "rows": len(rows),
        "estimated_earnings": earnings,
        "impressions": impressions,
        "clicks": clicks,
        "page_views": page_views,
        "ctr": clicks / max(impressions, 1.0),
        "page_rpm": (earnings / page_views * 1000.0) if page_views else 0.0,
    }


def topic_score(topic: dict[str, str], rows: list[dict[str, Any]]) -> float:
    keyword = topic["keyword"].lower()
    keyword_tokens = {token for token in re.split(r"[^a-z0-9]+", keyword) if len(token) > 2}
    dynamic_tokens = {"dynamic", "editable", "update", "updates", "reusable", "printing", "vcard"}
    score = 0.0

    for row in rows:
        query = row.get("keys", [""])[0].lower()
        query_tokens = {token for token in re.split(r"[^a-z0-9]+", query) if len(token) > 2}
        overlap = len(keyword_tokens & query_tokens)
        has_dynamic_intent = bool(dynamic_tokens & query_tokens)
        exactish = keyword in query or query in keyword
        if not exactish and overlap < 2 and not (overlap and has_dynamic_intent):
            continue

        impressions = float(row.get("impressions", 0))
        clicks = float(row.get("clicks", 0))
        position = float(row.get("position", 50))
        rank_gap = max(1.0, min(position, 40.0))
        score += impressions * (1 + overlap) / rank_gap
        score += clicks * 5
        if exactish:
            score += 20
        if has_dynamic_intent:
            score += 10

    return score


def ga4_topic_score(topic: dict[str, str], rows: list[dict[str, Any]]) -> float:
    topic_tokens = {token for token in re.split(r"[^a-z0-9]+", topic["keyword"].lower()) if len(token) > 2}
    score = 0.0
    for row in rows:
        path = str(row.get("landingPage", "")).lower()
        path_tokens = {token for token in re.split(r"[^a-z0-9]+", path) if len(token) > 2}
        overlap = len(topic_tokens & path_tokens)
        dynamic_path = any(token in path_tokens for token in ("dynamic", "editable", "vcard", "business", "card"))
        if not overlap and not dynamic_path:
            continue
        sessions = float(row.get("sessions", 0))
        engaged = float(row.get("engagedSessions", 0))
        engagement_rate = engaged / max(sessions, 1)
        score += sessions * (0.2 + engagement_rate)
        if overlap:
            score += overlap * 3
        if dynamic_path:
            score += 2
    return score


def keyword_planner_topic_score(topic: dict[str, str], ideas: list[dict[str, Any]]) -> float:
    topic_tokens = {token for token in re.split(r"[^a-z0-9]+", topic["keyword"].lower()) if len(token) > 2}
    score = 0.0
    for idea in ideas:
        text = str(idea.get("text", "")).lower()
        idea_tokens = {token for token in re.split(r"[^a-z0-9]+", text) if len(token) > 2}
        overlap = len(topic_tokens & idea_tokens)
        if not overlap:
            continue
        volume = float(idea.get("avg_monthly_searches", 0))
        competition = str(idea.get("competition", "")).upper()
        competition_factor = {"LOW": 1.4, "MEDIUM": 1.0, "HIGH": 0.7}.get(competition, 0.8)
        score += (volume ** 0.5) * overlap * competition_factor
    return score


def pick_topic(
    gsc_rows: list[dict[str, Any]] | None = None,
    ga4_rows: list[dict[str, Any]] | None = None,
    keyword_ideas: list[dict[str, Any]] | None = None,
) -> dict[str, str]:
    slugs = existing_slugs()
    candidates = [topic for topic in TOPICS if topic["slug"] not in slugs]
    if candidates and (gsc_rows or ga4_rows or keyword_ideas):
        scored = sorted(
            (
                (
                    topic_score(topic, gsc_rows or [])
                    + ga4_topic_score(topic, ga4_rows or [])
                    + keyword_planner_topic_score(topic, keyword_ideas or []),
                    topic,
                )
                for topic in candidates
            ),
            key=lambda item: item[0],
            reverse=True,
        )
        if scored[0][0] > 0:
            return scored[0][1]
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


def append_tracker(
    topic: dict[str, str],
    directory: str,
    status: dict[str, str],
    gsc_rows: list[dict[str, Any]],
    ga4_rows: list[dict[str, Any]],
    keyword_ideas: list[dict[str, Any]],
    adsense_summary: dict[str, Any],
) -> None:
    gsc_note = f"GSC live rows: {len(gsc_rows)}" if gsc_rows else f"GSC {status['gsc']}"
    ga4_note = f"GA4 landing rows: {len(ga4_rows)}" if ga4_rows else f"GA4 {status['ga4']}"
    keyword_note = f"Keyword Planner ideas: {len(keyword_ideas)}" if keyword_ideas else f"Keyword Planner {status['keyword_planner']}"
    if adsense_summary:
        adsense_note = (
            "AdSense "
            f"rows: {adsense_summary.get('rows', 0)}, "
            f"RPM: {adsense_summary.get('page_rpm', 0.0):.2f}, "
            f"CTR: {adsense_summary.get('ctr', 0.0):.2%}"
        )
    else:
        adsense_note = f"AdSense {status['adsense']}"
    line = (
        f"| {date.today().isoformat()} | {topic['keyword']} | `/blog/{topic['slug']}/` | "
        f"{gsc_note}; {ga4_note}; {keyword_note}; {adsense_note} | {directory} action card prepared | "
        f"Published by automation | Directory submission may require browser login/captcha | Next queue item |\n"
    )
    if not TRACKER.exists():
        TRACKER.parent.mkdir(parents=True, exist_ok=True)
        TRACKER.write_text("# Dynamic SEO Daily Tracker\n\n## Daily Log\n\n| Date | Keyword | Blog URL | Source Data | Directory Action | Status | Blockers | Next Queue Item |\n|---|---|---|---|---|---|---|---|\n", encoding="utf-8")
    text = TRACKER.read_text(encoding="utf-8")
    if f"| {date.today().isoformat()} |" not in text:
        marker = "\n## Directory Submission Rules"
        if marker in text:
            before, after = text.split(marker, 1)
            TRACKER.write_text(before.rstrip() + "\n" + line + marker + after, encoding="utf-8")
        else:
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
    try:
        gsc_rows = fetch_gsc_query_rows()
    except Exception as exc:
        gsc_rows = []
        status["gsc"] = f"blocked: {exc.__class__.__name__}"
    try:
        ga4_rows = fetch_ga4_landing_rows()
    except Exception as exc:
        ga4_rows = []
        status["ga4"] = f"blocked: {exc.__class__.__name__}"
    try:
        keyword_ideas = fetch_keyword_ideas(TOPICS)
    except Exception as exc:
        keyword_ideas = []
        status["keyword_planner"] = f"blocked: {exc.__class__.__name__}"
    try:
        adsense_summary = fetch_adsense_summary()
    except Exception as exc:
        adsense_summary = {}
        status["adsense"] = f"blocked: {exc.__class__.__name__}"
    topic = pick_topic(gsc_rows, ga4_rows, keyword_ideas)
    out_dir = BLOG_ROOT / topic["slug"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "index.html"
    if not out_file.exists():
        out_file.write_text(render_blog(topic), encoding="utf-8")
    directory = next_directory()
    write_directory_action_card(directory, topic)
    append_tracker(topic, directory, status, gsc_rows, ga4_rows, keyword_ideas, adsense_summary)
    run_update_indexes()
    print(json.dumps({"topic": topic, "api_status": status}, indent=2))


if __name__ == "__main__":
    main()
