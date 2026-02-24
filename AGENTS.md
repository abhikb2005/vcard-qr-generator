# AGENTS.md — Instructions for AI Agents

> **This file provides context and rules for any AI agent (Amp, Cursor, Copilot, Claude Code, etc.) working on this repository.**
> Read this file before making any changes.

## Project Overview

- **Product:** vCard QR Code Generator — a free, privacy-first tool for creating vCard QR codes
- **Site:** https://www.vcardqrcodegenerator.com
- **Hosting:** Cloudflare Pages (static HTML/JS/CSS — no server-side rendering)
- **Payment:** Dodo Payments (NOT Stripe — all Stripe references have been removed)
- **Analytics:** GA4 (G-E90B41BNEH) + Simple Analytics
- **Ads:** Google AdSense (ca-pub-1206702185649949)
- **Consent:** GDPR / Google Consent Mode v2 via `/consent.js` (must load before any tracking scripts)

## Critical Rules

### 1. Git Hygiene — Multiple Agents May Be Working Simultaneously
- **NEVER use `git add -A` or `git add .`** — other agents or the user may have uncommitted changes
- Only stage files YOU personally created or modified
- If you see unexpected changes in the worktree, **ignore them** — do not revert or modify them

### 2. Purchase Power Parity (PPP) — Required on ALL Paid Features
- Every page with a paid feature or checkout **MUST** include PPP pricing
- Currently implemented on:
  - `bulk-qr-code.html` — Custom ipapi.co script with coupon codes (GLOBAL20–GLOBAL60)
  - `logo-qr-code.html` — Parity Deals CDN banner
- **When adding any new paid feature:** Copy the PPP script from `bulk-qr-code.html` (lines 96–210). It uses ipapi.co for country detection and shows a discount banner with coupon codes based on PPP index tiers (20%–60% off).

### 3. Privacy-First Architecture
- All QR code generation happens **client-side in the browser**
- Contact data must **never** be sent to any server
- Do not add server-side analytics, tracking pixels, or data collection beyond GA4 + consent

### 4. Cookie Consent
- `/consent.js` must be included on **every page** and must load **before** any tracking/analytics scripts
- This is required for GDPR / Google Consent Mode v2 compliance

### 5. SEO & Content
- All blog posts must include: Article JSON-LD schema, FAQPage JSON-LD schema, AdSense units (top + bottom), internal links, and a Pro CTA section
- Competitor "alternative" blog posts follow the template at `blog/qr-io-alternative/index.html`
- When adding new blog posts: update `sitemap.xml` AND `blog_index.json`
- All pages must have: title tag, meta description, canonical URL, Open Graph tags
- See `data/competitor-blog-schedule.md` for the competitor blog post queue

### 6. Tech Stack & Conventions
- Static HTML + Tailwind CSS (via CDN: `https://cdn.tailwindcss.com`)
- No build tools or bundlers for the main site (the `vcard-qr-next/` directory is a separate Next.js project, not the live site)
- The `p/` directory contains programmatic SEO (pSEO) pages — 30 job+city landing pages
- Use existing code patterns — check neighboring files before adding new libraries

### 7. Pricing References
- Logo QR Code: **$4.99 one-time** (not a subscription)
- Bulk QR Code: free for CSV upload
- Never reference Stripe — payment is through **Dodo Payments**

## Key Files & Directories

| Path | Purpose |
|------|---------|
| `tasks.md` | Master task list with standing instructions — read this first |
| `blog/` | Blog posts (each in its own folder with `index.html`) |
| `blog_index.json` | Blog post metadata for the listing page |
| `sitemap.xml` | Sitemap — update when adding new pages |
| `data/competitor-blog-schedule.md` | 32-competitor blog post schedule |
| `data/backlink-strategy.md` | SEO backlink strategy |
| `data/content-gap-analysis.md` | GSC content gap analysis |
| `bulk-qr-code.html` | Bulk vCard QR code generator (has PPP reference implementation) |
| `logo-qr-code.html` | Logo QR code generator (paid feature) |
| `p/` | Programmatic SEO pages (30 job+city pages) |
| `consent.js` | GDPR cookie consent script |
| `workers/` | Cloudflare Workers (F5Bot monitor, etc.) |

## For Humans

If you're the repo owner: update this file whenever you add new rules, change the tech stack, or want to communicate something to AI agents. This file is automatically read by most AI coding tools.
