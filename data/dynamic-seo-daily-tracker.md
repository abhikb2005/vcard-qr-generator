# Dynamic SEO Daily Tracker

Purpose: one blog post and one directory/backlink action per day to promote Dynamic QR Codes.

## API / Data Source Status

| Source | Status | Notes |
|---|---|---|
| GSC | Available locally | `mcp-gsc/traffic_check.py` works when local OAuth token is valid. |
| GA4 | Blocked | Local token needs re-auth; previous run returned `invalid_grant`. |
| Google Ads Keyword Planner | Blocked | Needs developer token, customer ID, and OAuth credentials. |
| AdSense Management API | Blocked | Needs AdSense OAuth scope/account access. |
| Local directory docs | Available | `data/directory-submissions.md` and `data/backlink-strategy.md`. |
| Google Sheet directory list | Available for read | Sheet ID `1O09GuZaG5jGTAtOZj7mpPmyCjPDskKYe`. |

## Daily Log

| Date | Keyword | Blog URL | Source Data | Directory Action | Status | Blockers | Next Queue Item |
|---|---|---|---|---|---|---|---|
| 2026-05-04 | editable QR code; what QR code type for vCard with updates | `/blog/editable-qr-code/`; `/blog/what-qr-code-type-for-vcard-with-updates/` | Fresh GSC opportunity from sidecar: `what qr code type for vcard with updates` ranking ~7.3; Keyword Planner blocked | GitHub README backlink added; AlternativeTo action card prepared | Published 2 posts + hub; GitHub backlink completed; directory queued | External directory forms require account login or manual verification; no directory credentials provided | LinkedIn Company Page |

## Directory Submission Rules

- Submit only free listings unless the user explicitly approves payment.
- Use Microsoft Edge for browser automation when running locally.
- Do not bypass captchas or create paid accounts.
- If a directory requires login, captcha, or email verification, log the blocker and move to the next directory.
- Do not send outreach email without explicit approval; draft only.
