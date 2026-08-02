const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const bulk = read('bulk-qr-code.html');
assert.match(bulk, /id="billingName"/);
assert.match(bulk, /id="billingEmail"/);
assert.match(bulk, /CSV contacts stay in your browser and are never used as your billing identity/);
assert.match(bulk, /Step 1: Billing details/);
assert.match(bulk, /Step 2: Choose your bulk QR type/);
assert.match(bulk, /Step 3: Choose and pay/);
assert.match(bulk, /Why you’ll upload this CSV again after payment/);
assert.match(bulk, /We count its rows on this device to show the right export plan/);
assert.match(bulk, /We check the CSV row count again before enabling your download/);
assert.match(bulk, /data-bulk-checkout-plan="bulk_starter" data-tier="starter" disabled/);
assert.match(bulk, /Pay \$9 — unlock up to 50 QR codes/);
assert.match(bulk, /Branded bulk QR/);
assert.match(bulk, /bulk_starter_branded/);
assert.match(bulk, /pdt_0NkVHsqRpn3qFO1JCkUL2/);
assert.match(bulk, /value: 11\.99/);
assert.match(bulk, /value: 24\.99/);
assert.match(bulk, /value: 39\.99/);
assert.match(bulk, /id="bulkLogoInput"/);
assert.match(bulk, /errorCorrectionLevel: purchasedBranding \? 'H' : 'M'/);
assert.match(bulk, /uploaded_bulk_qr_logo/);
assert.match(bulk, /downloaded_branded_bulk_qr_zip/);
assert.match(bulk, /updateCheckoutButtons/);
assert.doesNotMatch(bulk, /cursor-pointer transition flex justify-between items-center/);
assert.match(bulk, /PAYMENT_API_URL = "https:\/\/vcardqrcodegenerator\.com\/payment"/);
assert.doesNotMatch(bulk, /dodo-create-checkout\.abhikb2005\.workers\.dev/);
assert.doesNotMatch(bulk, /customer@example\.com/);
assert.match(bulk, /body: JSON\.stringify\(\{ name, email, plan_id: product\.plan_id/);
assert.match(bulk, /verifyBulkPayment/);
assert.doesNotMatch(bulk, /assume Unlimited/);

const worker = read('workers/router.js');
assert.match(worker, /const STATIC_BULK_PLANS/);
assert.match(worker, /bulk_starter/);
assert.match(worker, /DODO_BULK_STARTER_PRODUCT_ID/);
assert.match(worker, /DODO_BULK_STARTER_BRANDED_PRODUCT_ID/);
assert.match(worker, /DODO_BULK_GROWTH_BRANDED_PRODUCT_ID/);
assert.match(worker, /DODO_BULK_ENTERPRISE_BRANDED_PRODUCT_ID/);
assert.match(worker, /billing_identity_required/);
assert.match(worker, /Billing details are separate from the contacts in your CSV/);
assert.match(worker, /return_path: '\/bulk-qr-code\.html'/);
assert.match(worker, /const fallbackCheckout = isBulkPlan \? null : await createLegacyStaticLogoCheckout/);
assert.match(worker, /staticPaidPlan\(body\.plan_id\)/);

for (const match of bulk.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\b(?:src|type=\"application\/ld\+json\")/i.test(match[1])) continue;
  new Function(match[2]);
}

console.log('bulk checkout contract tests passed');
