# Rs 3,000 Google Search Pilot

This is an approval-gated Search-only pilot. It must not be launched until the account conversion action records a Dodo-verified `purchase` as the primary conversion.

## Budget And Structure

| Campaign | Share | Maximum | Daily cap | Landing page |
|---|---:|---:|---:|---|
| Dynamic vCard QR | 70% | Rs 2,100 | Rs 210 | `https://app.vcardqrcodegenerator.com/login` |
| Branded vCard QR | 30% | Rs 900 | Rs 90 | `https://www.vcardqrcodegenerator.com/logo-qr-code.html` |

- Search network only.
- English language.
- Exact and phrase match only.
- No Display expansion, search partners, Performance Max, broad match, remarketing, or customer lists.
- Import files are under `docs/google-ads/import/`.

## Prelaunch Gate

1. Restore Google Ads OAuth and confirm access to customer `8387009764` without exposing credentials.
2. Confirm a Google Ads purchase conversion is enabled, primary, and deduplicated by transaction ID.
3. Confirm `clicked_pricing` and `pro_checkout_start` remain secondary observations and are not counted as revenue.
4. Run Keyword Planner for the draft keywords and retain only countries where the Rs 3,000 forecast supports at least 30 qualified clicks in total.
5. Create campaigns as **PAUSED**, inspect URLs, budgets, negatives, match types, conversion goals, and network settings, then obtain the final CEO launch approval.

If the forecast cannot support 30 qualified clicks, do not launch. Keep the Rs 3,000 unspent and report the forecast.

## Operating Rules

- Total account budget for this pilot is capped at Rs 300 per day and Rs 3,000 lifetime.
- Review search terms daily and add irrelevant terms as exact or phrase negatives.
- Pause all campaigns once spend reaches Rs 1,500 with no checkout starts.
- Continue beyond Rs 1,500 only with at least two checkout starts or one verified purchase.
- Never raise the budget during the pilot.
- Dodo-verified purchase and subscription revenue are the source of truth.

## Measurement

Primary conversion:

- `purchase`, fired only after Dodo verification, counting every transaction and passing transaction ID, value, and currency.

Secondary observations:

- `clicked_pricing`
- `pro_checkout_start`
- account creation or dynamic QR creation where available

Do not enable enhanced conversions or upload outreach contacts. The product's privacy-first rule prohibits using QR-form contact data for advertising.
