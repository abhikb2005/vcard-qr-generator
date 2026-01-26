#!/usr/bin/env python3
"""
Add AdSense to all blog posts.

This script:
1. Adds the AdSense script tag to <head>
2. Adds an ad unit after the header (top of content)
3. Adds an ad unit before the footer (end of content)
4. Adds a Pro CTA section

Run from project root: python scripts/add_adsense_to_blogs.py
"""

import os
import re
from pathlib import Path

ADSENSE_HEAD = '''  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1206702185649949"
    crossorigin="anonymous"></script>
  <style>
    .adsbygoogle-container { min-height: 100px; margin: 1.5rem 0; }
  </style>
'''

AD_UNIT_TOP = '''
    <!-- Ad Unit: Top of Content -->
    <div class="adsbygoogle-container">
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-1206702185649949"
        data-ad-slot="AUTO"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>
'''

AD_UNIT_BOTTOM = '''
    <!-- Ad Unit: End of Content -->
    <div class="adsbygoogle-container">
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-1206702185649949"
        data-ad-slot="AUTO"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>

    <!-- Pro CTA -->
    <section class="mt-8 p-6 rounded-xl bg-indigo-50 border border-indigo-200">
      <h2 class="text-xl font-semibold text-indigo-900">Create Your vCard QR Code</h2>
      <p class="mt-2 text-indigo-800">Generate a professional digital business card in seconds — free and instant.</p>
      <div class="mt-4 flex flex-wrap gap-3">
        <a href="/" class="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Try Free Generator</a>
        <a href="/logo-qr-code.html" class="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 border border-indigo-300 hover:bg-indigo-50">Add Your Logo (Pro)</a>
      </div>
    </section>
'''


def add_adsense_to_file(filepath: Path) -> bool:
    """Add AdSense to a single blog HTML file. Returns True if modified."""
    content = filepath.read_text(encoding='utf-8')
    
    # Skip if already has AdSense
    if 'adsbygoogle' in content:
        print(f"  Skipping (already has AdSense): {filepath}")
        return False
    
    modified = False
    
    # 1. Add AdSense script to <head> (before </head>)
    if '</head>' in content:
        content = content.replace('</head>', ADSENSE_HEAD + '</head>')
        modified = True
    
    # 2. Add top ad unit after </header>
    if '</header>' in content:
        content = content.replace('</header>', '</header>' + AD_UNIT_TOP)
        modified = True
    
    # 3. Add bottom ad unit before </main>
    if '</main>' in content:
        content = content.replace('</main>', AD_UNIT_BOTTOM + '\n  </main>')
        modified = True
    
    if modified:
        filepath.write_text(content, encoding='utf-8')
        print(f"  Updated: {filepath}")
    
    return modified


def main():
    # Find project root (where blog/ directory is)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    blog_dir = project_root / 'blog'
    
    if not blog_dir.exists():
        print(f"Error: blog directory not found at {blog_dir}")
        return
    
    print(f"Scanning blog directory: {blog_dir}\n")
    
    updated = 0
    skipped = 0
    
    for html_file in blog_dir.rglob('*.html'):
        result = add_adsense_to_file(html_file)
        if result:
            updated += 1
        else:
            skipped += 1
    
    print(f"\nDone! Updated: {updated}, Skipped: {skipped}")


if __name__ == '__main__':
    main()
