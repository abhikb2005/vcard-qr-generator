# Day 8 — Post-Instrumentation Funnel Baseline

## Objective

Establish the first clean baseline after the event taxonomy and false-positive fixes were deployed. This baseline is descriptive, not an experiment result.

## Observation window

Use the first complete 7-day period after the QR error-noise fix reached production. Do not mix pre-fix and post-fix traffic.

Record:

- start date:
- end date:
- timezone:
- GA4 property:
- deployment SHA active for the full window:

## Primary funnel

Build a GA4 Funnel Exploration using **Total users**, not raw event count, so repeated actions by one user do not inflate progression.

1. `generated_qr_code` OR `generated_branded_qr_code`
2. `download_qr` OR `pro_download_branded_qr`
3. `clicked_dynamic_qr_cta` OR `clicked_pricing`
4. `pro_checkout_start`
5. `purchase`
6. `pro_download_branded_qr`

### Funnel configuration

- Technique: Funnel exploration
- Funnel type: Open funnel for discovery
- Also create a closed-funnel duplicate starting at generation for strict conversion analysis
- Within same session: off for the first baseline
- Elapsed time: on
- Breakdown: device category
- Optional secondary breakdowns: source/medium, landing page, source_page
- Exclude internal/test traffic where possible

GA4 funnel exploration counts users progressing through the defined sequence; when the same user fires the same step more than once, the first occurrence is used for the funnel step. This prevents raw event repetition from being interpreted as multiple people.

## Supporting event table

Create a Free-form Exploration with:

- Rows: Event name
- Metrics: Total users, Event count, Event count per active user
- Filter event name to:
  - `generated_qr_code`
  - `generated_branded_qr_code`
  - `download_qr`
  - `clicked_dynamic_qr_cta`
  - `clicked_pricing`
  - `pro_checkout_start`
  - `purchase`
  - `payment_success`
  - `pro_payment_success`
  - `pro_download_branded_qr`
  - `error_qr_generation`

Use event count only as a diagnostic alongside users. Do not calculate funnel conversion from raw event count.

## Baseline worksheet

| Stage | Event rule | Users | Step conversion | Overall conversion | Notes |
|---|---|---:|---:|---:|---|
| Product creation | generated static or branded QR |  | 100% | 100% |  |
| Value realization | free or branded download |  |  |  |  |
| Monetization intent | dynamic or pricing CTA |  |  |  |  |
| Checkout intent | checkout session created |  |  |  |  |
| Verified revenue | purchase |  |  |  |  |
| Paid value realization | branded download after unlock |  |  |  |  |

Formulas:

- Step conversion = users at current step / users at previous step
- Overall conversion = users at current step / users at product creation
- Checkout abandonment = 1 - purchase users / checkout-start users
- Paid fulfillment rate = paid-download users / purchase users

Do not report a percentage when the denominator is below 20 users. Report the counts and label the result directional.

## Diagnostic cuts

After capturing the overall baseline, inspect only the highest-leverage cuts:

1. Landing page or `source_page`
2. Device category
3. Session source/medium
4. CTA location for `clicked_dynamic_qr_cta` and `clicked_pricing`
5. Error stage for `error_qr_generation`

Avoid slicing low-volume data into many segments. Small samples create false precision.

## Quality checks

Before accepting the baseline:

- `purchase`, `payment_success`, and `pro_payment_success` should reconcile for verified test or real transactions, allowing for clearly documented implementation differences.
- `purchase` must not exceed verified payments.
- `pro_download_branded_qr` may be lower than purchase, but should not materially exceed it for the same observation window unless access windows cross date boundaries.
- successful generation/download journeys should not emit `error_qr_generation`.
- inspect whether test traffic is present and annotate it rather than silently treating it as customer behavior.
- check the GA4 data-quality indicator for thresholding or sampling notes.

## Decision rule

The purpose of this baseline is to choose the next experiment, not to prove growth.

Select the largest meaningful drop where:

- the event definition is trustworthy;
- enough users reached the previous step;
- the product can influence the transition;
- the likely fix can be shipped and measured within one week.

## Day 8 completion evidence

Attach or link:

1. Funnel Exploration screenshot
2. Supporting event table export or screenshot
3. Completed baseline worksheet
4. One paragraph naming the largest observed drop and the next hypothesis

## Current status

Framework complete. Baseline numbers remain pending until a full post-fix observation window is available and exported from GA4.
