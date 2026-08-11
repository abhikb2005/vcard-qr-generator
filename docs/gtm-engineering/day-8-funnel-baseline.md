# Day 8: GA4 Funnel Baseline

## Objective

Create a clean, user-based baseline for the free QR-to-monetization journey. This document defines the GA4 Funnel Exploration configuration, the event semantics behind each step, the quality checks required before interpreting the numbers, and the evidence needed to close Day 8. It does not claim performance metrics that are not available in this repository.

## Event definitions and source paths

| Funnel concept | Canonical event or rule | Current implementation and meaning |
|---|---|---|
| QR generated | `generated_qr_code` | Homepage static QR success after the settled output is rendered in `index.html`; also used by the Next.js app after a dynamic QR record is created successfully. Do not count button clicks as generation. |
| QR downloaded | `download_qr` | Homepage static QR download in `index.html`. It represents the free output being saved. |
| Monetization intent | `clicked_dynamic_qr_cta` OR `clicked_pricing` | Canonical CTA events across the static site, blogs, bulk flow, logo pages, and app handoffs. `clicked_pricing` is intent only; it is not revenue. |
| Checkout started | `pro_checkout_start` | Sent after a checkout URL is successfully returned and immediately before redirecting to Dodo, for the static paid/logo flow. It is checkout intent, not payment. |
| Verified purchase | `purchase` | GA4 recommended ecommerce event sent by `trackPurchase` after a successful server verification response. It includes `transaction_id`, `value`, `currency`, and `items`, and is idempotent in `analytics.js`/the Next.js analytics helper. Use this as the primary revenue step. |
| Payment companion | `payment_success` | Sent alongside `purchase` by `trackPurchase` when a transaction ID exists. It is useful for debugging and reconciliation, but is not a second purchase. |
| Premium activation | `pro_payment_success` | Sent after the page saves a verified unlock and `trackPurchase` accepts the transaction. It represents browser activation of premium access, not a separate revenue conversion. Legacy token-validator returns can also reach this path, so it is not the cleanest revenue step for the baseline. |
| Paid value realization | `pro_download_branded_qr` after `purchase` | Static logo pages gate the final branded download behind `featureUnlocked`, which is set after Dodo verification or a legacy token validation. Use the ordered combination `purchase` -> `pro_download_branded_qr` for a verified-payment realization view. The download event alone is not proof of payment. |

### Payment verification evidence in code

- Static logo pages call `verifyDodoPayment()` in [`logo-qr-code.html`](../../logo-qr-code.html) and [`qr-code-with-logo.html`](../../qr-code-with-logo.html). The function POSTs to `/payment/verify` and throws when `json.success` is false. Only after that response do they save `pro_verified_unlock`, call `trackPaymentSuccess`, and unlock the paid UI.
- The Worker route is [`workers/router.js`](../../workers/router.js), at `verifyStaticLogoPayment()`. It reads the Dodo credential from a Worker secret binding, fetches the Dodo payment or checkout record, requires `status === 'succeeded'`, checks the allowed product, and returns `success: true` only for that verified result.
- The static success page [`success.html`](../../success.html) follows the same pattern: it calls `/payment/verify`, stores the unlock only after success, then calls `trackPurchase` and `pro_payment_success`.
- The Next.js dashboard calls its server verification endpoint before `trackPurchase` in [`vcard-qr-next/src/app/dashboard/DashboardClient.tsx`](../../vcard-qr-next/src/app/dashboard/DashboardClient.tsx). The exact server verification implementation should be included in the evidence review for any app subscription rows.
- [`analytics.js`](../../analytics.js) sends `purchase` and `payment_success` together and suppresses repeats by `transaction_id` in `localStorage` under `vcard_ga4_purchase_ids`.

### Important payment caveat

The repository still preserves legacy token-validator return paths on the static logo pages and bulk flow. Those paths are server-validated tokens, but they are not the same evidence as a fresh Dodo payment-record lookup. For the cleanest Day 8 revenue baseline, use a post-Dodo-verification observation window and treat any legacy-token traffic as a documented limitation. Do not use `pro_payment_success` alone as verified revenue.

## Final six-step funnel

This is the recommended primary funnel for free/static users who may upgrade after creating and downloading a QR:

**Step 1:** `generated_qr_code`

**Step 2:** `download_qr`

**Step 3:** `clicked_dynamic_qr_cta` OR `clicked_pricing`

**Step 4:** `pro_checkout_start`

**Step 5:** `purchase`, with `payment_provider = dodo`, `payment_status = succeeded`, and a non-empty `transaction_id` where GA4 parameter filtering is available

**Step 6:** `pro_download_branded_qr`, occurring after Step 5 for the same user

`generated_branded_qr_code` and `pro_download_branded_qr` should be monitored in a companion premium funnel because branded users may enter directly on the logo page and bypass the homepage free-generation step.

## Why checkout start is excluded from Step 3

The broad definition of monetization intent can include `clicked_dynamic_qr_cta`, `clicked_pricing`, and `pro_checkout_start`. For this ordered six-step funnel, including `pro_checkout_start` in Step 3 makes Step 3 overlap with Step 4 and obscures the transition from pricing/upgrade interest to an actual checkout session.

Use `clicked_dynamic_qr_cta` OR `clicked_pricing` for Step 3. Keep `pro_checkout_start` exclusively as Step 4. If a separate intent report is needed, create a free-form event table or a short secondary funnel where all three are grouped as one OR condition, but do not use that redundant definition for the primary conversion rates.

## Exact GA4 Funnel Exploration configuration

Create this manually in **Explore > Funnel exploration**:

1. Set the technique to **Funnel exploration**.
2. Set the funnel to **Closed** for the primary baseline. This ensures the reported conversion describes users who began with a generated QR and then progressed through the defined journey.
3. Set the counting method to **Total users**. Do not use event count, sessions, or event count per active user for the funnel conversion calculation.
4. Turn **Within same session** off for the primary view. Payment redirects and return journeys can span sessions; the user-based baseline should allow the full observation window. Create a secondary same-session view only as a diagnostic.
5. Define the steps in order:
   - Step 1: event name exactly matches `generated_qr_code`.
   - Step 2: event name exactly matches `download_qr`.
   - Step 3: event name exactly matches `clicked_dynamic_qr_cta` OR event name exactly matches `clicked_pricing`.
   - Step 4: event name exactly matches `pro_checkout_start`.
   - Step 5: event name exactly matches `purchase`; add parameter filters `payment_provider` equals `dodo`, `payment_status` equals `succeeded`, and `transaction_id` is present if the GA4 UI exposes those event parameters in the step filter.
   - Step 6: event name exactly matches `pro_download_branded_qr`.
6. Set the observation window to **the last seven complete calendar days in the GA4 property timezone**, excluding the current partial day. Record the exact start/end dates in the worksheet below. Do not mix pre-fix traffic with the first clean post-deployment window.
7. Use **Device category** as the first breakdown. Then inspect `source_page`, landing page, source/medium, and CTA location only after the overall baseline is captured.
8. Exclude known internal, QA, synthetic-payment, and browser-test traffic using the GA4 comparison/filter controls where available.
9. Save the exploration as `Day 8 - User Funnel Baseline - YYYY-MM-DD`.

### Recommended observation window

Use the first complete seven-day period after the deployed analytics/payment verification logic was active for the whole period. If that deployment date cannot be established, use the most recent seven complete days and record the uncertainty. GA4 property timezone controls the boundary; do not assume the analyst's local timezone.

## Counting method and formulas

Use user counts at each step. Do not substitute raw event totals: one user may generate, download, or retry more than once.

Record:

| Field | Value |
|---|---|
| GA4 property | `G-E90B41BNEH` |
| Observation start | `[YYYY-MM-DD]` |
| Observation end | `[YYYY-MM-DD]` |
| GA4 property timezone | `[record from GA4]` |
| Active deployment SHA | `[record from deployment history]` |
| Internal/test traffic treatment | `[excluded or annotated]` |

Baseline worksheet:

| Stage | Users | Step conversion | Overall conversion | Drop-off | Notes |
|---|---:|---:|---:|---:|---|
| 1. QR generated | `[ ]` | `100%` | `100%` | `[ ]` | `generated_qr_code` |
| 2. QR downloaded | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `download_qr` |
| 3. Monetization intent | `[ ]` | `[ ]` | `[ ]` | `[ ]` | OR of two CTA events |
| 4. Checkout started | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `pro_checkout_start` |
| 5. Verified purchase | `[ ]` | `[ ]` | `[ ]` | `[ ]` | Canonical `purchase` only |
| 6. Paid branded download | `[ ]` | `[ ]` | `[ ]` | `[ ]` | `pro_download_branded_qr` after purchase |

Formulas:

- Step conversion = users at current step / users at previous step.
- Overall conversion = users at current step / users at Step 1.
- Step drop-off = 1 - step conversion.
- Checkout-to-purchase rate = verified purchase users / checkout-start users.
- Paid value realization rate = users reaching Step 6 after Step 5 / verified purchase users.

Leave all values blank until exported from GA4. Do not invent percentages. For small denominators, report counts and label the rate directional rather than presenting false precision.

## Data-quality checks

Before calling the baseline complete:

- Confirm the funnel uses **Total users**, not event count.
- Confirm Step 3 uses OR logic and Step 4 is separate.
- Confirm Step 5 is `purchase`, not the combined count of `purchase`, `payment_success`, and `pro_payment_success`.
- Compare `purchase` users with server-verified Dodo payment records for the same period where that report is available. GA4 alone cannot prove payment verification.
- Confirm `payment_success` is a companion to `purchase`, not counted as an additional purchase.
- Check that `pro_payment_success` is interpreted as activation and that legacy-token rows are identified or excluded from a pure Dodo baseline.
- Confirm `pro_download_branded_qr` users are not interpreted as revenue unless they also appear after Step 5 in the ordered funnel.
- Review `error_qr_generation` by `source_page`, `qr_type`, `error_stage`, `error_message`, and `recovered`; successful generation/download journeys should not create this event.
- Remove internal, synthetic, and QA traffic from the analysis or annotate it clearly.
- Check GA4's data-quality, thresholding, and sampling indicators before copying numbers into the worksheet.

## Known limitations

- GA4 user-based funnels are subject to consent, modeling, identity, thresholding, and cross-domain/session limitations.
- A user who starts on the static site and returns from Dodo may be affected by browser consent state or linker behavior.
- `purchase` is the canonical event, but GA4 cannot independently prove that a browser event came from the Worker. Reconcile it against server verification records.
- Legacy token-validator paths can produce activation/revenue-shaped events without the same fresh Dodo payment lookup. This is why `pro_payment_success` is not the canonical revenue step.
- Step 6 expresses ordered user progression, not a transaction-ID join. A user can have multiple purchases or downloads within the observation window.
- The primary funnel excludes users who enter directly on the branded/logo page before a homepage `generated_qr_code`. Use the companion premium funnel for that population.
- No baseline metrics are reported in this document because GA4 data exports/screenshots were not supplied.

## Evidence required to close Day 8

Bring back:

1. A screenshot of the saved closed, user-based six-step Funnel Exploration showing the selected date range and user counts.
2. A screenshot or export of the Step 3 OR configuration proving that `clicked_dynamic_qr_cta` and `clicked_pricing` are both included.
3. A screenshot or export showing Step 5 is `purchase` with the verified-payment parameter filters, where available.
4. A screenshot of the companion premium funnel using `generated_branded_qr_code` and the ordered `purchase` -> `pro_download_branded_qr` path.
5. The completed worksheet: users, step conversion, overall conversion, drop-off, and the largest constraint.
6. A server-side verification reconciliation or deployment note confirming the observation window used the Dodo-verified path.
7. A note identifying any test traffic, legacy-token traffic, GA4 thresholding, or missing parameter dimensions.

## Decision rule for the next experiment

Day 8 should recommend one next experiment only after the data-quality checks pass. Choose the largest user drop between two adjacent stages that has a trustworthy event definition, enough users at the prior stage to be directionally useful, and a product change the team can influence within one week.

- Largest drop at Step 2: test download visibility, output confidence, or CTA placement after generation.
- Largest drop at Step 3: test value-moment copy and CTA prominence after download.
- Largest drop at Step 4: test pricing clarity, checkout friction, or plan presentation.
- Largest drop at Step 5: investigate Dodo return/verification friction before changing marketing copy.
- Largest drop at Step 6: test premium activation guidance, branded-download UX, or payment-to-value handoff.

Do not close Day 8 with a claimed winner or invented metric. Close it with a reproducible funnel configuration, evidence screenshots, the completed worksheet, and one evidence-backed experiment hypothesis.

## Current status

Repository audit and funnel configuration are complete. The user counts, conversion rates, drop-offs, largest constraint, and final Day 8 close decision remain pending GA4 screenshots/exports and server-verification reconciliation.
