from __future__ import annotations
import json, subprocess
from datetime import datetime, timezone
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, tostring

ROOT = Path(__file__).resolve().parents[2]
SITE = "https://vcardqrcodegenerator.com"
MANIFEST = ROOT / "blog_index.json"
SITEMAP = ROOT / "sitemap.xml"
ROBOTS  = ROOT / "robots.txt"

def git_lastmod(path_rel: str) -> str:
    try:
        iso = subprocess.check_output(
            ["git", "log", "-1", "--format=%cI", "--", path_rel],
            cwd=ROOT,
            text=True
        ).strip()
        if iso:
            return iso
    except Exception:
        pass
    return datetime.now(timezone.utc).isoformat()

def add_url(parent: Element, loc: str, lastmod_iso: str):
    u = SubElement(parent, "url")
    SubElement(u, "loc").text = loc
    SubElement(u, "lastmod").text = lastmod_iso

def main():
    urlset = Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")

    # Core pages (derive lastmod from git)
    core = [
        (f"{SITE}/", "index.html"),
        (f"{SITE}/privacy-policy.html", "privacy-policy.html"),
        (f"{SITE}/contact.html", "contact.html"),
        (f"{SITE}/blogs/", "blogs/index.html"),
    ]
    for loc, rel in core:
        add_url(urlset, loc, git_lastmod(rel))

    # Blog posts (from manifest)
    posts = []
    if MANIFEST.exists():
        posts = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for p in posts:
        loc = f"{SITE}{p['url']}" if not p['url'].startswith("http") else p['url']
        lastmod = p.get("date") or datetime.now(timezone.utc).date().isoformat()
        # normalize to full datetime
        if len(lastmod) == 10:  # YYYY-MM-DD
            lastmod = f"{lastmod}T00:00:00+00:00"
        add_url(urlset, loc, lastmod)

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + tostring(urlset, encoding="unicode")
    SITEMAP.write_text(xml, encoding="utf-8")

    # Ensure robots.txt advertises sitemap
    line = f"Sitemap: {SITE}/sitemap.xml"
    if ROBOTS.exists():
        txt = ROBOTS.read_text(encoding="utf-8")
        if line not in txt:
            ROBOTS.write_text((txt.rstrip() + "\n" + line + "\n"), encoding="utf-8")
    else:
        ROBOTS.write_text(line + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
