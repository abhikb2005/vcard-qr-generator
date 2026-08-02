const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const bulk = read('bulk-qr-code.html');
assert.match(bulk, /id="billingName"/);
assert.match(bulk, /id="billingEmail"/);
assert.match(bulk, /CSV contacts stay in your browser and are never used as your billing identity/);
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
