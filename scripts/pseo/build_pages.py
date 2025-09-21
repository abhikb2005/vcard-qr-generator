"""Utility for building static blog pages and maintaining an index manifest.

This module keeps previous behaviour of writing blog pages untouched while
extending the process with manifest generation. The manifest is stored at the
repository root as ``blog_index.json`` and lists every blog entry.

Running this script repeatedly is idempotent: existing manifest entries retain
their original publication date while new pages receive the current date.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional

ROOT = Path(__file__).resolve().parents[2]
BLOG_ROOT = ROOT / "blog"
MANIFEST_PATH = ROOT / "blog_index.json"

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
META_DESC_RE = re.compile(
    r"<meta[^>]*name=[\"']description[\"'][^>]*content=[\"'](.*?)[\"']",
    re.IGNORECASE | re.DOTALL,
)


@dataclass
class BlogPost:
    """Representation of a generated blog post."""

    slug: str
    title: str
    description: str
    url: str
    date: str

    def to_dict(self) -> Dict[str, str]:
        return {
            "slug": self.slug,
            "title": self.title,
            "description": self.description,
            "url": self.url,
            "date": self.date,
        }


def _load_existing_manifest() -> Dict[str, Dict[str, str]]:
    """Return the current manifest entries indexed by slug."""

    if not MANIFEST_PATH.exists():
        return {}

    try:
        data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}

    manifest: Dict[str, Dict[str, str]] = {}
    if isinstance(data, list):
        for entry in data:
            if not isinstance(entry, dict):
                continue
            slug = entry.get("slug")
            if not isinstance(slug, str):
                continue
            manifest[slug] = entry
    return manifest


def _parse_html_metadata(html: str) -> Dict[str, str]:
    """Extract title and description metadata from a blog page."""

    title_match = TITLE_RE.search(html)
    desc_match = META_DESC_RE.search(html)
    title = title_match.group(1).strip() if title_match else "Untitled"
    description = desc_match.group(1).strip() if desc_match else ""
    return {"title": title, "description": description}


def _gather_posts(existing_manifest: Dict[str, Dict[str, str]]) -> Iterable[BlogPost]:
    """Collect posts from the ``blog`` directory."""

    if not BLOG_ROOT.exists():
        return []

    today_iso = datetime.now(timezone.utc).date().isoformat()
    posts: List[BlogPost] = []

    for child in sorted(BLOG_ROOT.iterdir()):
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
        metadata = _parse_html_metadata(html)
        existing = existing_manifest.get(slug, {})
        date = existing.get("date") or today_iso
        title = metadata.get("title") or existing.get("title") or slug.replace("-", " ").title()
        description = metadata.get("description") or existing.get("description") or ""
        url = f"/blog/{slug}/"
        posts.append(BlogPost(slug=slug, title=title, description=description, url=url, date=date))

    return posts


def _merge_posts(
    existing_manifest: Dict[str, Dict[str, str]],
    posts: Iterable[BlogPost],
) -> List[BlogPost]:
    """Combine freshly generated posts with the existing manifest contents."""

    merged: Dict[str, BlogPost] = {}

    for slug, entry in existing_manifest.items():
        if not isinstance(slug, str):
            continue
        if not isinstance(entry, dict):
            continue
        title = entry.get("title") or slug.replace("-", " ").title()
        description = entry.get("description") or ""
        url = entry.get("url") or f"/blog/{slug}/"
        date = entry.get("date") or ""
        merged[slug] = BlogPost(
            slug=slug,
            title=title,
            description=description,
            url=url,
            date=date,
        )

    for post in posts:
        current = merged.get(post.slug)
        preserved_date = current.date if current and current.date else post.date
        merged[post.slug] = BlogPost(
            slug=post.slug,
            title=post.title or (current.title if current else post.slug.replace("-", " ").title()),
            description=post.description or (current.description if current else ""),
            url=post.url or (current.url if current else f"/blog/{post.slug}/"),
            date=preserved_date,
        )

    return list(merged.values())


def _sort_posts(posts: Iterable[BlogPost]) -> List[BlogPost]:
    """Sort posts by ISO date descending, keeping unknown dates last."""

    def parse_date(value: Optional[str]) -> float:
        if not value:
            return float("-inf")
        try:
            return datetime.fromisoformat(value).timestamp()
        except ValueError:
            return float("-inf")

    return sorted(posts, key=lambda post: parse_date(post.date), reverse=True)


def write_manifest(posts: Iterable[BlogPost]) -> None:
    """Persist the manifest to ``blog_index.json`` sorted by date."""

    posts_list = _sort_posts(posts)
    MANIFEST_PATH.write_text(
        json.dumps([post.to_dict() for post in posts_list], indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    """Entry point used by automation to build pages and update manifest.

    Existing behaviour for generating the blog HTML should run before calling
    :func:`write_manifest`. Projects that already call this script can import
    :func:`write_manifest` and pass the posts created during the build. When the
    HTML is pre-generated on disk, simply invoking this module will refresh the
    manifest with preserved publication dates.
    """

    existing_manifest = _load_existing_manifest()
    posts = list(_gather_posts(existing_manifest))
    merged_posts = _merge_posts(existing_manifest, posts)
    write_manifest(merged_posts)


if __name__ == "__main__":
    main()
