from __future__ import annotations
import json, re, subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional
from xml.etree.ElementTree import Element, SubElement, tostring

ROOT = Path(__file__).resolve().parents[2]
SITE = "https://vcardqrcodegenerator.com"
MANIFEST = ROOT / "blog_index.json"
SITEMAP = ROOT / "sitemap.xml"
ROBOTS  = ROOT / "robots.txt"

BLOG_DIRS = ["blog", "blogs"]  # scan both roots

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
META_DESC_RE = re.compile(
    r"<meta\s+[^>]*name=[\"']description[\"'][^>]*content=[\"'](.*?)[\"']",
    re.IGNORECASE | re.DOTALL,
)

@dataclass
class Post:
    slug: str
    url: str
    title: str
    description: str
    date: str  # ISO date (YYYY-MM-DD)

    def to_dict(self) -> Dict[str, str]:
        return {
            "slug": self.slug,
            "title": self.title,
            "description": self.description,
            "url": self.url,
            "date": self.date,
        }

def _git_last_commit_iso(path: Path) -> str:
    try:
        iso = subprocess.check_output(
            ["git", "log", "-1", "--format=%cI", "--", str(path.relative_to(ROOT))],
            cwd=ROOT, text=True
        ).strip()
        if iso:
            return iso
    except Exception:
        pass
    return datetime.now(timezone.utc).isoformat()

def _parse_html_meta(html: str) -> Dict[str, str]:
    title_match = TITLE_RE.search(html)
    desc_match = META_DESC_RE.search(html)
    title = (title_match.group(1).strip() if title_match else "Untitled")
    description = (desc_match.group(1).strip() if desc_match else "")
    return {"title": title, "description": description}

def _load_manifest() -> Dict[str, Dict[str, str]]:
    if not MANIFEST.exists():
        return {}
    try:
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except Exception:
        return {}
    out = {}
    if isinstance(data, list):
        for row in data:
            if isinstance(row, dict) and "slug" in row:
                out[row["slug"]] = row
    return out

def _discover_posts() -> List[Post]:
    existing = _load_manifest()
    posts: List[Post] = []
    for root_name in BLOG_DIRS:
        root = ROOT / root_name
        if not root.exists():
            continue
        for idx in sorted(root.glob("*/index.html")):
            slug = idx.parent.name
            # URL namespace matches the directory root
            url = f"/{root_name}/{slug}/"
            try:
                html = idx.read_text(encoding="utf-8")
            except Exception:
                html = ""
            meta = _parse_html_meta(html)
            prev = existing.get(slug, {})
            # Preserve existing date when possible; else derive from git commit date
            prev_date = prev.get("date", "")
            if prev_date:
                date_iso = prev_date[:10]
            else:
                commit_iso = _git_last_commit_iso(idx)
                date_iso = commit_iso[:10]
            posts.append(
                Post(
                    slug=slug,
                    url=url,
                    title=meta["title"] or prev.get("title") or slug.replace("-", " ").title(),
                    description=meta["description"] or prev.get("description", ""),
                    date=date_iso,
                )
            )
    # Sort newest first by date
    posts.sort(key=lambda p: p.date, reverse=True)
    return posts

def _write_manifest(posts: Iterable[Post]) -> None:
    MANIFEST.write_text(
        json.dumps([p.to_dict() for p in posts], indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

def _add_url(urlset: Element, loc: str, lastmod_iso: str):
    el = SubElement(urlset, "url")
    SubElement(el, "loc").text = loc
    SubElement(el, "lastmod").text = lastmod_iso

def _write_sitemap(posts: List[Post]) -> None:
    urlset = Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")

    # Core pages (derive lastmod from git)
    core = [
        (f"{SITE}/", ROOT / "index.html"),
        (f"{SITE}/privacy-policy.html", ROOT / "privacy-policy.html"),
        (f"{SITE}/contact.html", ROOT / "contact.html"),
    ]
    # Include /blogs/ if it exists
    blogs_index = ROOT / "blogs" / "index.html"
    if blogs_index.exists():
        core.append((f"{SITE}/blogs/", blogs_index))

    for loc, path in core:
        _add_url(urlset, loc, _git_last_commit_iso(path))

    # Blog posts
    for p in posts:
        # lastmod as full ISO datetime based on git of that index.html
        idx = ROOT / p.url.strip("/").split("/")[0] / p.slug / "index.html"
        lastmod = _git_last_commit_iso(idx)
        _add_url(urlset, f"{SITE}{p.url}", lastmod)

    xml = "<!-- GENERATED: do not edit by hand -->\n" + \
          '<?xml version="1.0" encoding="UTF-8"?>\n' + \
          tostring(urlset, encoding="unicode")
    SITEMAP.write_text(xml, encoding="utf-8")

def _ensure_robots():
    line = f"Sitemap: {SITE}/sitemap.xml"
    if ROBOTS.exists():
        txt = ROBOTS.read_text(encoding="utf-8")
        if line not in txt:
            ROBOTS.write_text((txt.rstrip() + "\n" + line + "\n"), encoding="utf-8")
    else:
        ROBOTS.write_text(line + "\n", encoding="utf-8")

def main():
    posts = _discover_posts()
    _write_manifest(posts)
    _write_sitemap(posts)
    _ensure_robots()

if __name__ == "__main__":
    main()
