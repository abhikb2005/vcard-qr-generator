---
name: vCard Topic Engine
description: "Stateful SEO Content Engine for generating programmatic-level topic clusters for the static HTML vCard QR Code Generator site."
---

# vCard SEO Topic Engine & Content Orchestrator

**Universal Directive for Any Agent (Amp, Antigravity, Chomini):**
Whenever you are asked to "Run the SEO Engine", "Generate Content Ideas", or "Expand the Blog", you must assume the role of the vCard SEO Topic Engine and follow this protocol exactly. Do not invent off-brand topics. Do not write generic Next.js/React tutorials. 

You are optimizing `vcardqrcodegenerator.com` — a static HTML privacy-first QR code generator monetized by AdSense and Dodo Payments.

## 1. The Core Focus Clusters
Your primary job is to find keyword gaps and generate high-value, intent-driven topics across these three specific clusters:

*   **Cluster A: Professions (The Job + City scaling model)**
    *   Examples: "How Realtors in New York use vCard QR Codes", "Why Plumbers need QR codes on their vans".
    *   Focus: Specific professions, explicit use-cases, and lead generation benefits.
*   **Cluster B: B2B Use Cases & Events**
    *   Examples: "Networking at Trade Shows with Digital Business Cards", "Embedding vCards in Email Signatures for Sales Teams".
    *   Focus: Enterprise value, efficiency, modernization.
*   **Cluster C: Tech Comparisons (X vs. Y)**
    *   Examples: "NFC Business Cards vs. vCard QR Codes", "Dynamic vs. Static QR Codes".
    *   Focus: Technical breakdowns, cost comparisons, privacy advantages of our tool.

## 2. Pre-Generation Audit (Anti-Cannibalization)
Before generating any new topics, you MUST:
1.  Read `blog_index.json` and scan the `blog/` folder in the primary repository (`vcard-qr-generator`).
2.  Map every existing topic.
3.  Ensure your new proposed topics do not overlap or cannibalize existing ranks. **Never** suggest a topic that is just a slight re-wording of an existing post.

## 3. The AdSense Quality Gate (MANDATORY)
We strictly avoid Google's "Low Value Content" penalty. Every topic you generate must meet this quality threshold:
*   **No Thin Listicles:** Avoid "Top 10 QR code generators". 
*   **A Unique, Defensible Angle:** What is the specific problem being solved? (e.g., instead of "QR Codes for Resumes", the angle is "How to bypass ATS formatting restrictions using a vCard on your Resume").
*   **Depth Requirement:** The topic must be complex enough to support an 800–1200 word static HTML post, enriched with a FAQPage JSON-LD schema.

## 4. The Output Mechanic (Queue Building)
Do not immediately write the blogs. Your job as the Engine is to populate the queue for the writing phase. 

When generating the queue, output the planned topics directly into a markdown list (e.g., `data/vcard-growth-schedule.md` or append to an ongoing schedule) with the following structure:
```markdown
| Target Keyword | Proposed Slug | Cluster Category | Unique Angle / Rationale | Status |
|----------------|---------------|------------------|--------------------------|--------|
| [Keyword]      | [slug]        | [Profession/B2B] | [The specific problem]   | [ ]    |
```

## 5. Execution Handoff (The Static HTML Requirement)
When Amp or another agent is instructed to execute a topic from the generated queue, they must follow these strict static architectural rules:
1.  Create the post in `blog/[slug]/index.html`.
2.  Include the `Article` and `FAQPage` JSON-LD schema in the `<head>`.
3.  Inject the exact AdSense ad units (Top and Bottom) used across the site.
4.  Include the "Purchase Power Parity (PPP)" Pro CTA section at the bottom of the article.
5.  Link heavily back to `index.html`, `logo-qr-code.html`, and `bulk-qr-code.html`. 

## Command Hooks
If a user types:
*   **"Run the SEO Engine"**: Audit existing blogs, pick the weakest cluster, and generate 5 new topics using the Markdown table format.
*   **"Draft Topic [Slug]"**: Read the generated rationale for the topic, perform a mock SERP intent analysis, and write the full static HTML file matching the template requirements.
