# Dynamic SEO Daily Tracker

Purpose: one blog post and one directory/backlink action per day to promote Dynamic QR Codes.

## API / Data Source Status

| Source | Status | Notes |
|---|---|---|
| GSC | Available in GitHub Actions | OAuth secrets `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, and `GSC_REFRESH_TOKEN` are configured; daily runner can pull live Search Console query rows. |
| GA4 | Available in GitHub Actions | OAuth secrets `GA4_CLIENT_ID`, `GA4_CLIENT_SECRET`, `GA4_REFRESH_TOKEN`, and `GA4_PROPERTY_ID` are configured; daily runner can pull landing-page engagement data. |
| Google Ads Keyword Planner | Available in GitHub Actions | Repo secrets are configured for developer token, OAuth refresh, and accessible customer/login ID `8387009764`; live Keyword Planner smoke test succeeded. |
| AdSense Management API | Blocked | Needs AdSense OAuth scope/account access. |
| Local directory docs | Available | `data/directory-submissions.md` and `data/backlink-strategy.md`. |
| Google Sheet directory list | Available for read | Sheet ID `1O09GuZaG5jGTAtOZj7mpPmyCjPDskKYe`. |

## Daily Log

| Date | Keyword | Blog URL | Source Data | Directory Action | Status | Blockers | Next Queue Item |
|---|---|---|---|---|---|---|---|
| 2026-05-04 | editable QR code; what QR code type for vCard with updates | `/blog/editable-qr-code/`; `/blog/what-qr-code-type-for-vcard-with-updates/` | Fresh GSC opportunity from sidecar: `what qr code type for vcard with updates` ranking ~7.3; Keyword Planner blocked | GitHub README backlink added; AlternativeTo action card prepared | Published 2 posts + hub; GitHub backlink completed; directory queued | External directory forms require account login or manual verification; no directory credentials provided | LinkedIn Company Page |
| 2026-05-05 | editable vcard qr code | `/blog/editable-vcard-qr-code/` | GSC/local seeds; Keyword Planner blocked: missing Google Ads credentials | LinkedIn Company Page action card prepared | Published by automation | Directory submission may require browser login/captcha | Next queue item |

## Directory Submission Rules

- Submit only free listings unless the user explicitly approves payment.
- Use Microsoft Edge for browser automation when running locally.
- Do not bypass captchas or create paid accounts.
- If a directory requires login, captcha, or email verification, log the blocker and move to the next directory.
- Do not send outreach email without explicit approval; draft only.
