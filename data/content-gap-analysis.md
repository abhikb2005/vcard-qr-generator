# Content Gap Analysis — vcardqrcodegenerator.com

**Date:** February 21, 2026  
**Data Source:** Google Search Console (last 90 days: Nov 23, 2025 – Feb 21, 2026)

---

## Key Findings

### Current Performance
- **Top query:** "vcard qr code" — 646 impressions, 0 clicks, position 71
- **Best CTR query:** "free vcard qr code generator" — 133 impressions, 2 clicks (1.5%), position 54
- **Top page:** Homepage — 2,092 impressions (www) + 1,041 (non-www), 27 total clicks
- **Only 10 of 35 blog posts** are getting any GSC impressions

### Biggest Content Gaps

Queries getting significant impressions but landing on the homepage (not a dedicated blog post):

| Query Cluster | Combined Impressions | Current Position | Dedicated Content? |
|---|---|---|---|
| "business card qr code generator" variations | ~400 | 75–87 | ❌ No blog post |
| "vcard qr code format" / "qr code vcard format" | ~152 | 60–81 | ❌ Partially covered |
| "add logo to qr code" | ~54 | 22–82 | ❌ Product page only |
| "create vcard qr code" variations | ~60 | 65–70 | ❌ No how-to guide |
| "digital business card qr code" (free) | ~58 | 88–93 | ⚠️ Partially covered |

---

## 5 Recommended New Blog Posts

### 1. "Free Business Card QR Code Generator — Create & Download Instantly"
**Target keywords:**
- business card qr code generator (72 imp, pos 76)
- business card qr code generator free (61 imp, pos 77)
- visiting card qr code generator (75 imp, pos 83)
- qr code business card free (57 imp, pos 75)
- qr code generator for business card (48 imp, pos 78)
- free business card qr code generator (30 imp, pos 79)

**Why:** ~400 combined impressions with NO dedicated blog content. These searchers specifically want a business card QR code — a targeted post could capture this traffic immediately.

**Angle:** Step-by-step guide showing how to create a QR code specifically for business cards. Include placement tips, print specifications, and design best practices.

---

### 2. "vCard QR Code Format Explained: What Data Is Inside & How It Works"
**Target keywords:**
- qr code vcard format (80 imp, pos 81)
- vcard qr code format (72 imp, pos 60)
- vcard format (related long-tail queries)

**Why:** ~152 impressions for format-related queries. People want to understand the technical format — our existing "VCF contact file" post only partially covers this.

**Angle:** Technical explainer of the vCard 3.0/4.0 format: field names (FN, TEL, EMAIL, ORG, ADR), character encoding, and how it gets encoded into a QR code. Include a sample vCard file with annotations.

---

### 3. "How to Add a Logo to Your QR Code (Free Guide + Tool)"
**Target keywords:**
- add logo to qr code (38 imp, pos 82)
- vcard qr code generator with logo (16 imp, pos 23)

**Why:** 54 impressions with no blog content. We have a product page (logo-qr-code.html) at position 47, but a blog post would create an additional ranking opportunity and funnel traffic to the product.

**Angle:** Tutorial explaining error correction levels, logo size limits, and step-by-step instructions using our tool. Include before/after examples.

---

### 4. "How to Create a vCard QR Code (Step-by-Step, 2026)"
**Target keywords:**
- create vcard qr code (32 imp, pos 68)
- create qr code vcard (29 imp, pos 68)
- generate qr code vcard (19 imp, pos 65)
- create a vcard qr code (22 imp, pos 67)

**Why:** ~100 impressions for "create" intent queries. These people are ready to act — they just need a clear tutorial. Our existing "vcard-qr-code-generator" blog post is more of a feature overview, not a how-to.

**Angle:** Dead-simple tutorial: "Enter name → Enter phone → Click Generate → Download." Screenshots of each step. Emphasize "no signup, no email, free."

---

### 5. "Bulk vCard QR Code Generator: Create Codes for Your Entire Team"
**Target keywords:**
- bulk vcard qr code generator (13 imp, pos 55)
- qr code generator for business card (supports existing queries)

**Why:** Position 55 is our closest ranking for this query — a dedicated blog post could push us to page 1. This also supports the bulk-qr-code.html product page and targets a high-intent B2B audience (office managers, HR teams).

**Angle:** Use case walkthrough: "Upload a CSV with 50 employees → download 50 unique QR codes." Include a sample CSV template and show the output.

---

## Additional Observations

1. **Non-www still getting separate impressions** — The non-www version of the homepage has 1,041 impressions. Although we redirect, Google may still be indexing both. Verify the redirect is working with `curl -I vcardqrcodegenerator.com`.

2. **Blog listing page ranks well** — `/blogs/` has position 14.6 with 61 impressions. This suggests Google values our blog hub.

3. **Privacy policy and contact pages rank** — These get impressions at positions 6–7, which is normal for branded navigational queries.

4. **25 of 35 blog posts get ZERO impressions** — These may need internal linking improvements or content refreshes to start appearing in search.
