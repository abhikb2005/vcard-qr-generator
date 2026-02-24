# pSEO Engine Handoff Guide

This guide explains how to manage and eventually activate the dynamic pSEO engine built within the Next.js application.

## 🏗️ Architecture Overview

The engine follows a standard **Data + Template + Route** pattern:
1.  **Data Source**: Currently lives in `src/data/dummy.ts` (JSON-based) and Supabase (`qr_codes` table for vCard profiles).
2.  **Template**: The UI is controlled by `src/templates/ComparisonPage.tsx`. Changing this file updates thousands of pages instantly.
3.  **Dynamic Routes**: 
    - `/comparison/[slug]` -> Handles competitor alternatives.
    - `/p/[id]` -> Handles job+city or specific vCard profiles.

## 🚀 Activation: "Flipping the Switch"

Currently, the main domain serves **static HTML files** from the root `/p/` and `/blog/` directories. To "flip the switch" and let the Next.js engine take over:

1.  **Backup**: Ensure all static content in the root `/p/` and `blog/` folders is backed up or imported into the Next.js data structures.
2.  **Delete Static Directories**: Remove the static folders from the root directory so Vercel/Cloudflare defaults to the Next.js routes.
3.  **Update Routes**: Ensure `next.config.ts` or the routing logic matches the expected URL structure (e.g., ensuring slugs stay identical).
4.  **Deploy**: Run a full production build and deploy.

## 🛠️ How to "Run pSEO Engine"

To expand the engine, add new entries to `src/data/dummy.ts` or the Supabase database. The engine will automatically generate a new page for every new slug added to the data source.

### Verification Command
Run this to see which pages the engine is currently aware of:
`npx next build` (Check the route summary at the end of the build logs).

---
*Created by Antigravity for Amp & Future Agents.*
