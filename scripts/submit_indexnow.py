"""Submit the current sitemap URLs to IndexNow.

IndexNow notifies participating search engines such as Bing and Yandex that
URLs were added or updated. It helps discovery but does not guarantee indexing.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


HOST = "vcardqrcodegenerator.com"
KEY = "a15ee629f3a7f1dce0f201154fb3a6cd"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
SITEMAP = Path(__file__).resolve().parents[1] / "sitemap.xml"
ENDPOINT = "https://api.indexnow.org/indexnow"


def sitemap_urls() -> list[str]:
    tree = ET.parse(SITEMAP)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = []
    for loc in tree.findall(".//sm:loc", ns):
        if loc.text and loc.text.startswith(f"https://{HOST}/"):
            urls.append(loc.text.strip())
    return sorted(set(urls))


def submit(urls: list[str]) -> tuple[int, str]:
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=10000)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    urls = sitemap_urls()[: args.limit]
    print(f"Found {len(urls)} URLs for host {HOST}.")
    print(f"Key location: {KEY_LOCATION}")
    if args.dry_run:
        for url in urls[:20]:
            print(url)
        if len(urls) > 20:
            print(f"... {len(urls) - 20} more")
        return 0

    status, body = submit(urls)
    print(f"IndexNow response: HTTP {status}")
    if body:
        print(body)
    return 0 if status in (200, 202) else 1


if __name__ == "__main__":
    sys.exit(main())
