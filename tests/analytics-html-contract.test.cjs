const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

{
  const homepage = read('index.html');
  assert.match(homepage, /staticGenerationId/);
  assert.match(homepage, /lastRenderedStaticGenerationId/);
  assert.match(homepage, /scheduleStaticSuccess/);
  assert.match(homepage, /scheduleStaticFailure/);
  assert.match(homepage, /generationId !== staticGenerationId/);
  assert.match(homepage, /setTimeout\(\(\) => \{[\s\S]*generated_qr_code/);
}

for (const file of ['logo-qr-code.html', 'qr-code-with-logo.html']) {
  const html = read(file);
  assert.match(html, /brandedGenerationId/);
  assert.match(html, /lastRenderedBrandedGenerationId/);
  assert.match(html, /scheduleBrandedSuccess/);
  assert.match(html, /scheduleBrandedFailure/);
  assert.match(html, /generationId !== brandedGenerationId/);
  assert.match(html, /Promise\.resolve\(updateResult\)/);
  assert.match(html, /__PAYMENT_VERIFY_API__/);
  assert.match(html, /verifyDodoPayment/);
  assert.match(html, /pro_verified_unlock/);
  assert.doesNotMatch(html, /paymentId && status === 'succeeded'\)\s*\{[\s\S]{0,240}localStorage\.setItem\('pro_unlocked_until'/);
}

{
  const success = read('success.html');
  assert.match(success, /payment\/verify/);
  assert.match(success, /pro_verified_unlock/);
  assert.match(success, /trackPurchase/);
  assert.match(success, /pro_payment_success/);
  assert.doesNotMatch(success, /trackEvent\('payment_success'[\s\S]*purchase_tracked: false/);
}

{
  const worker = read('workers/router.js');
  assert.match(worker, /\/payment\/verify/);
  assert.match(worker, /DODO_BASE_URL/);
  assert.match(worker, /\/payments\/\$\{encodeURIComponent\(paymentId\)\}/);
  assert.match(worker, /String\(env\.DODO_API_KEY \|\| env\.DODO_PAYMENTS_API_KEY \|\| ''\)\.trim\(\)/);
  assert.match(worker, /catch \{\s*return json\(\{\s*success: false,\s*status: 'verification_failed'/);
  assert.match(worker, /status === 'succeeded'/);
  assert.match(worker, /total_amount/);
}

console.log('analytics HTML contract tests passed');
