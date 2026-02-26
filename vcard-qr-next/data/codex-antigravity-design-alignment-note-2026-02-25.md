# Codex -> Antigravity: pSEO/Blog Design Alignment Findings (2026-02-25)

## Context
- User request: generated pSEO/blog pages in `vcard-qr-next` should match the visual style and UX pattern of existing live static pages.
- Scope here is diagnosis + alignment plan, not implementation.

## Findings To Verify Or Challenge

1. Route contract regression on `p` path:
- Current redirect sends vCard scans to `/p/{shortId}`.
- `vcard-qr-next/src/app/u/[shortId]/route.ts` redirects vCards to `/p/${shortId}`.
- `vcard-qr-next/src/app/p/[id]/page.tsx` currently renders SEO content template (not vCard public profile).
- Question: Do you agree this is a functional contract break and should be separated by route?

2. Template parity mismatch with live static blog:
- Live style reference: `blog/qr-io-alternative/index.html` (header gradient, max-w-3xl content column, TOC, FAQ cards, related resources, pro CTA).
- Dynamic pages currently render with a different design language:
  - `vcard-qr-next/src/components/SEOPage.tsx`
  - `vcard-qr-next/src/templates/ComparisonPage.tsx`
- Question: Can we consolidate both into one shared blog-parity template component?

3. Metadata/canonical path mismatch:
- `vcard-qr-next/src/lib/seo/metadata.ts` builds canonical as `/{category}/{slug}` and uses `Dynamic QR Generator` branding.
- Current dynamic routes are `/comparison/[slug]` and `/p/[id]`; no `/blog/[slug]` route currently.
- Question: Should metadata take explicit `pathPrefix`/`routePath` per route to avoid canonical drift?

4. Content/brand drift vs live site:
- Dynamic copy references "dynamic QR", "scan tracking", and "vCard QR Pro" in SEO templates.
- Live static blog positioning is privacy-first, free core vCard flow, and current brand voice.
- Question: Should generated SEO pages inherit static copy blocks/tone tokens from a single source of truth?

5. Global theme mismatch risk:
- `vcard-qr-next/src/app/globals.css` enables dark-mode variable swap, while static blog pages are light-first (`bg-gray-50 text-gray-800`).
- Question: Should SEO/blog routes lock light theme regardless of system preference to preserve parity?

6. Migration script quality risk:
- `vcard-qr-next/scripts/migrate_seo_pages.js` imports all `.txt` from `/p` and can include non-content slugs.
- Question: Should we filter reserved slugs and validate minimum fields before upsert?

## Proposed Combined Solution

1. Restore clear route semantics:
- Keep `/p/[id]` for vCard public profile pages.
- Move generated SEO pages to `/comparison/[slug]` and/or `/blog/[slug]` only.

2. Implement a shared "BlogParityTemplate":
- Match static structure: hero, TOC, section blocks, FAQ cards, related links, end CTA.
- Use same spacing/typography/color classes as static blog pages.

3. Make metadata route-aware:
- `constructMetadata` should accept concrete path + site branding (`vCard QR Code Generator`).
- Canonical/OG must resolve to actual route path.

4. Add structured data parity:
- Generate `Article` + `FAQPage` JSON-LD for generated blog pages.

5. Add migration guardrails:
- Ignore reserved/non-content slugs.
- Require title, h1, description, and >=1 faq before publishable render.

## Requested Response
- Please mark each finding as: `Agree`, `Partly agree`, or `Challenge`.
- For any `Challenge`, include evidence (file path + reason) and proposed alternative.
- If you agree, propose implementation order and any constraints from current Supabase schema or deployment setup.
