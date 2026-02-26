import os
import re
from pathlib import Path

P_DIR = Path(r"C:\Users\abhik\OneDrive\Documents\GitHub\vcard-qr-generator\p")

def fix_file(file_path):
    content = file_path.read_text(encoding="utf-8")
    original = content
    
    # 1. Fix "Top 3 Use Cases for ...ss" -> "...s"
    # Matches words ending with double 's' before </h3>, e.g. "Real Estate Agentss"
    content = re.sub(r'(Top 3 Use Cases for [\w\s]+?s)s</h3>', r'\1</h3>', content)
    
    # 2. Fix the awkward "Your ...s details" -> "Your ... details"
    # E.g. "Your Real Estate Agents details" -> "Your Real Estate Agent details"
    # Find the sentence: <p class="text-gray-600">Your (.*?) details are saved
    def fix_details(m):
        prof = m.group(1)
        if prof.endswith('s') and not prof.endswith('ss'):
            prof_singular = prof[:-1]
            return f'Your {prof_singular} details are saved'
        return m.group(0)
        
    content = re.sub(r'Your (.*?) details are saved', fix_details, content)
    
    if content != original:
        file_path.write_text(content, encoding="utf-8")
        print(f"Fixed: {file_path.name}")

if __name__ == "__main__":
    count = 0
    for f in P_DIR.glob("*.html"):
        if f.name not in ["index.html", "404.html", "_not-found.html"]:
            fix_file(f)
            count += 1
