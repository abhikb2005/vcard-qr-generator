import os
import re
from pathlib import Path

P_DIR = Path(r"C:\Users\abhik\OneDrive\Documents\GitHub\vcard-qr-generator\p")

use_cases_template = """
<div class="py-20 bg-white border-t border-gray-100">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900">Business Networking in {city}</h2>
            <p class="text-gray-600 mt-4 max-w-2xl mx-auto">Success in {city} depends on how quickly you can turn a handshake into a digital connection. Don't let your contact info get lost in a pile of paper.</p>
        </div>
        <div class="grid md:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
                <div class="flex gap-4">
                    <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                    <div>
                        <h3 class="text-xl font-bold mb-2">Instant Save</h3>
                        <p class="text-gray-600">Your {profession} details are saved directly to their contacts. No typos, no manual entry.</p>
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                    <div>
                        <h3 class="text-xl font-bold mb-2">Eco-Friendly</h3>
                        <p class="text-gray-600">Stop re-printing business cards every time your office in {city} moves or your title changes.</p>
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                    <div>
                        <h3 class="text-xl font-bold mb-2">Always on You</h3>
                        <p class="text-gray-600">Your digital vCard is on your phone. You're never "out of cards" at a {city} mixer.</p>
                    </div>
                </div>
            </div>
            <div class="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
                <h3 class="text-2xl font-bold text-indigo-900 mb-6">Top 3 Use Cases for {profession}s</h3>
                <div class="space-y-6">
                    <div class="bg-white p-5 rounded-xl shadow-sm">
                        <h4 class="font-bold text-gray-900">1. Email Signatures</h4>
                        <p class="text-sm text-gray-600 mt-1">Make your remote {city} meetings more personal by letting attendees scan your screen.</p>
                    </div>
                    <div class="bg-white p-5 rounded-xl shadow-sm">
                        <h4 class="font-bold text-gray-900">2. Physical Mailers</h4>
                        <p class="text-sm text-gray-600 mt-1">Add to flyers or posters across {city} to bridge the gap to digital.</p>
                    </div>
                    <div class="bg-white p-5 rounded-xl shadow-sm">
                        <h4 class="font-bold text-gray-900">3. LinkedIn Profiles</h4>
                        <p class="text-sm text-gray-600 mt-1">Showcase your tech-savviness to other pros in {city}.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
"""

def patch_file(file_path):
    print(f"Patching {file_path.name}...")
    content = file_path.read_text(encoding="utf-8")
    
    # Extract profession and city from title or body
    # Title: QR Code Generator for Real Estate Agents in New York | ...
    title_match = re.search(r"<title>QR Code Generator for (.*?) in (.*?) \|", content)
    if not title_match:
        print(f"  Skipping: Could not find title pattern in {file_path.name}")
        return
    
    profession = title_match.group(1).strip()
    city = title_match.group(2).strip()
    
    # Insert before the FAQ section
    faq_start = content.find('<div class="py-20 bg-gray-50"><div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"><h2 class="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>')
    
    if faq_start == -1:
        print(f"  Skipping: Could not find FAQ section in {file_path.name}")
        return
    
    new_section = use_cases_template.format(profession=profession, city=city)
    
    # Check if already patched
    if "Business Networking in" in content:
        print(f"  Skipping: Already patched.")
        return
        
    new_content = content[:faq_start] + new_section + content[faq_start:]
    file_path.write_text(new_content, encoding="utf-8")
    print(f"  Successfully patched {file_path.name}")

def main():
    for f in P_DIR.glob("*.html"):
        if f.name == "index.html" or f.name == "404.html" or f.name == "_not-found.html":
            continue
        patch_file(f)

if __name__ == "__main__":
    main()
