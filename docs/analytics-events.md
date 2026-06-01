# Analytics Event Taxonomy

This site uses `trackEvent(eventName, params = {})` from `/analytics.js` on the static site and `src/lib/analytics.ts` inside the Next.js app. The helper safely no-ops when GA4 is blocked or `window.gtag` is unavailable, and automatically adds `page_path`, `page_title`, `page_location`, and `event_timestamp`.

| Event name | Trigger | Key parameters | Why it matters | GA4 key event? |
|---|---|---|---|---|
| `generated_qr_code` | A normal/static vCard QR renders successfully on the homepage. Also used in the app when a dynamic QR record is created successfully. | `qr_type`, `source_page`, `has_logo`, `output_available` | Measures QR creation before download, so the top of the product funnel is visible. | No |
| `generated_branded_qr_code` | A branded/logo QR renders successfully after a logo has been uploaded. | `qr_type`, `source_page`, `has_logo`, `logo_uploaded`, `output_available` | Separates free logo upload interest from successful branded QR creation. | No |
| `clicked_dynamic_qr_cta` | A user clicks a CTA pointing to the dynamic/pro QR flow. | `cta_text`, `cta_location`, `destination_url`, `source_page` | Measures static-site to SaaS handoff intent. | No |
| `clicked_pricing` | A user clicks pricing, upgrade, buy, or checkout CTA. | `plan_id`, `plan_name`, `value`, `currency`, `source_page` | Shows pricing intent before checkout creation. | No |
| `pro_checkout_start` | Checkout URL/session is successfully created and the user is about to be redirected to Dodo checkout. | `plan_id`, `plan_name`, `value`, `currency`, `source_page` | Measures real checkout starts, not just button clicks. | Yes |
| `purchase` | Payment success is confirmed by a return page or app verification route. | `transaction_id`, `value`, `currency`, `items` | GA4 recommended ecommerce purchase event for revenue reporting. | Yes |
| `payment_success` | Sent alongside `purchase`, or as a fallback custom payment success event when transaction details are incomplete. | `transaction_id`, `plan_id`, `plan_name`, `value`, `currency` | Easier custom funnel reporting and debugging against Dodo records. | Yes |
| `error_qr_generation` | A QR generation/rendering operation fails and does not recover after retry. Do not fire for empty forms, preview refreshes, validation warnings, delayed async renders that later succeed, or successful downloads. | `qr_type`, `source_page`, `error_stage`, `error_message`, `recovered` | Makes real broken generation states visible without collecting contact data or polluting Realtime with harmless render timing. | No |
| `download_qr` | Existing homepage QR download click. | `event_category`, `event_label`, `has_name` | Measures completion of the free static QR journey. | Yes |
| `pro_logo_upload` | Existing logo upload event on paid/logo pages. | `event_category`, `event_label` | Measures branded QR customization intent. | No |
| `pro_download_branded_qr` | Existing branded QR download click. | `event_category`, `event_label` | Measures paid logo feature completion. | Yes |
| `pro_page_view` | Existing logo/pro page load event. | `event_category`, `event_label` | Preserves the current pro funnel baseline. | No |

## Purchase Idempotency

`purchase` is de-duplicated in `localStorage` by `transaction_id` using the key `vcard_ga4_purchase_ids`. Refreshing a payment success URL should not send another `purchase` for the same transaction. The helper still no-ops safely if localStorage is unavailable.

## Error Event Rules

`error_qr_generation` is reserved for unrecovered failures only. Use `error_stage` to identify where the failure happened:

- `validation`: only for unrecoverable validation blockers, not normal empty form states or duplicate-alias warnings.
- `generation`: QR data creation or persistence failed and the user could not continue.
- `rendering`: the QR output did not appear after retrying async rendering.
- `download`: the QR existed but export/download failed.
- `unknown`: use only when the stage cannot be safely classified.

Set `recovered: false` for `error_qr_generation`. If a delayed render or retry succeeds, do not send `error_qr_generation`; use a separate retry/debug event only if needed.

## GA4 Realtime Test Journeys

1. Homepage static QR: enter a full name, wait for the QR to render, then click download. Expected events: `generated_qr_code`, `download_qr`.
2. vCard logo QR: unlock or simulate the payment return, upload a logo, wait for the QR to render, then download. Expected events: `pro_logo_upload`, `generated_branded_qr_code`, `pro_download_branded_qr`.
3. Dynamic/pro CTA: click a link to `app.vcardqrcodegenerator.com`. Expected event: `clicked_dynamic_qr_cta`.
4. Pricing/checkout: click a logo-page or bulk-page buy button, or an app dashboard upgrade plan. Expected events: `clicked_pricing`, then `pro_checkout_start` after a checkout URL is returned.
5. Payment success: complete or simulate a Dodo success return with a stable transaction/payment/session ID. Expected events: `purchase`, `payment_success`; refresh should not duplicate `purchase`.
6. Error noise check: repeat the homepage and logo journeys slowly and quickly, including initial page load, empty form state, style/color changes, logo upload, and download. Expected: no `error_qr_generation` unless the QR never renders after retries or generation throws.
