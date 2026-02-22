# vCard QR Generator - Task List

## ✅ Completed

### Core Product
- [x] AdSense integration across 26+ blog pages and listing page
- [x] Expanded 16 thin blog posts to 800–1200 words with FAQ JSON-LD schema
- [x] GA4 tracking (G-E90B41BNEH) + full Pro conversion funnel
- [x] Purchase Power Parity (PPP) on logo & bulk pages
- [x] Pro UX: enlarged logo overlay, "24h access" pricing clarity, Pro CTA on free page
- [x] Logo QR page fixes: garbled rendering, duplicate QR, payment race conditions, double download bug
- [x] Pro features: color picker, corner styles, background color, SVG/Hi-Res, frame templates
- [x] Copyright years and guide titles updated to 2026
- [x] AGENTS.md documentation created
- [x] Deploy Cloudflare Workers GitHub Actions workflow fixed
- [x] GDPR / Google Consent Mode v2 compliance (consent.js on all pages, privacy policy updated)
- [x] Add `SoftwareApplication` + `offers` schema to tool pages
- [x] Visual before/after comparison for Pro page
- [x] Pricing clarity: $4.99 on logo page button/info, tiered pricing on bulk page
- [x] Removed all Stripe references, updated to Dodo Payments

### Marketing & Promotion
- [x] Directory submissions: Indie Hackers, Uneed, CtrlAlt.cc, Hunt0, DevHunt
- [x] Dev.to article published
- [x] Reddit Day 1: Directory submissions
- [x] Reddit Day 2: r/smallbusiness
- [x] Reddit Day 3: r/AlphaAndBetaUsers
- [x] Social listening replies: r/FilmFestivals, r/LuxuryTravel, r/smallbusiness, r/CRM, r/b2bmarketing

### Blog Calendar
| Date | Topic | Status |
|------|-------|--------|
| Feb 3 | QR Code on Resume | ✅ Done |
| Feb 4 | NFC vs QR Code Business Cards | ✅ Done |
| Feb 5 | Dynamic vs Static vCard QR Codes | ✅ Done |

### Automation & Tools
- [x] F5Bot Cloudflare Worker deployed (workers/f5bot-monitor.js)
- [x] Telegram bot @F58ot_bot set up for notifications
- [x] NanoClaw/Claude Code installed on Ubuntu WSL with Docker
- [x] VS Code Tunnels and AnyDesk remote access set up

### KDP Sudoku Books
- [x] Automation pipeline built (auto_generate.py, book_pages.py, cover_generator.py)
- [x] 134-page professional Sudoku book + wraparound cover generated
- [x] KDP_PUBLISHING_GUIDE.md created

---

## 🔲 Pending / To Do

### Product — High Priority
- [ ] B2B "Team/Bulk" contact CTA
- [ ] A/B test pricing tiers ($9 vs $19)

### SEO
- [x] Internal linking between blog posts (Related Resources added to all 35 posts)
- [x] Homepage SEO: title tag, meta description, H1 optimized for "free vcard qr code generator"
- [x] Backlink strategy created (data/backlink-strategy.md)
- [x] pSEO fixes: canonical tags on 30 pages, sitemap (75 URLs), hub page, footer links, localhost URL fixes
- [ ] Execute backlink strategy Tier 1 (tool directory submissions — manual, user does this)
- [ ] Glasp SEO backlink strategy (needs account setup, extension install, whitelisting)

### SEO Sprint — Execute Sequentially (Next Thread)
> **Instructions:** Execute these tasks IN ORDER, one at a time. Each builds on the previous.
> Repo: C:\Users\abhik\OneDrive\Documents\GitHub\vcard-qr-generator
> Site: https://www.vcardqrcodegenerator.com (Cloudflare Pages, static HTML/JS)
> Other agents work on this repo — only commit files YOU change. Never use `git add -A`.

1. [x] **Add FAQ JSON-LD schema to pSEO pages** — Added FAQ structured data to all 30 job+city pages under `p/`. Each page now has 3 FAQ items in JSON-LD format for rich snippet eligibility.

2. [x] **Technical SEO audit & fixes** — Fixed robots.txt (removed duplicate non-www sitemap). Stripped 9 unnecessary Next.js JS bundles from all 30 pSEO pages (saved 506 KB / 64% page weight reduction). No missing alt tags or localhost URLs in deployed pages.

3. [x] **Reddit post drafts** — Created ready-to-paste posts for 6 subreddits (r/SideProject, r/InternetIsBeautiful, r/Entrepreneur, r/freelance, r/realtors, r/sales). Saved to `data/reddit-post-drafts.md`.

4. [x] **Content gap analysis via GSC** — Queried GSC for 90-day data. Top gap: "business card qr code generator" cluster (~400 impressions, no blog post). Recommended 5 new blog topics. Report saved to `data/content-gap-analysis.md`.

5. [x] **Execute backlink strategy Tier 1 prep** — Prepared copy-paste submission info for all 13 tool directories with names, descriptions, categories, and checklist. Saved to `data/directory-submissions.md`.

### Marketing — Daily Promo Queue
- [ ] r/SideProject
- [ ] r/InternetIsBeautiful
- [ ] r/Entrepreneur
- [ ] r/freelance
- [ ] r/realtors
- [ ] r/sales
- [ ] LinkedIn 4-week content calendar execution
- [ ] Product Hunt launch (parked — pending account re-verification)

### Blog — Ongoing
- [ ] Daily: Research keywords and generate a blog post
  - Tools: Google Trends, AnswerThePublic, Ubersuggest, QuestionDB
  - Trigger: Say "blog" to start

### Standing Instructions (Recurring)
> **These tasks repeat on a schedule. Execute when triggered or when starting a new thread.**

1. **Daily: Competitor "Alternative" Blog Post** — Create one competitor comparison blog post per day from the schedule at `data/competitor-blog-schedule.md`. Follow the template pattern in `blog/qr-io-alternative/index.html`. Add to sitemap.xml and blog_index.json. Mark the competitor as done in the schedule. Next up: Scanova (Feb 23).

2. **Weekly (every Monday): GSC Performance Check** — Run `mcp-gsc/traffic_check.py` to pull the latest Google Search Console data. Compare impressions, clicks, position trends vs. prior week. Report findings and flag any ranking drops or new opportunities. Last checked: Feb 22, 2026.

### Infrastructure & Secrets
- [ ] Rotate leaked API keys
- [ ] Configure Cloudflare secrets (GROQ_API_KEY, TELEGRAM_BOT_TOKEN)
- [ ] Set up Cloudflare Email Routing for F5Bot
- [ ] Verify Cloudflare dashboard secrets (DODO_WEBHOOK_SECRET, DODO_API_KEY, JWT_PRIVATE_KEY)
- [ ] Claude Code: manually authenticate and run /setup
- [ ] Ralph agent / prd skills installation (deferred)

### KDP — Blocked
- [ ] KDP identity verification failed — pursue alternatives:
  - [ ] Lulu (Print-on-Demand)
  - [ ] Etsy / Gumroad (digital printables)

### Future Side Hustle Roadmap
- [ ] eBooks
- [ ] Printables
- [ ] Affiliate microsites
- [ ] Faceless YouTube
- [ ] AI Podcasts
- [ ] Newsletters
- [ ] Workflows
- [ ] Business Wars podcast idea
- [ ] Rank & rent sites
- [ ] GBP management
- [ ] Custom stickers
- [ ] "Print this tweet" bot
- [ ] Novella project
- [ ] Email capture for newsletter/product updates
