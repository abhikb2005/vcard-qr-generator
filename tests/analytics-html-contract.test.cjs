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
  assert.match(homepage, /Create editable QR codes/);
  assert.match(homepage, /postGenerateCta/);
  assert.match(homepage, /Need to edit this later\?/);
  assert.match(homepage, /postDownloadCta/);
  assert.match(homepage, /Printing this QR\?/);
  assert.match(homepage, /Want this print-ready with your logo\?/);
  assert.match(homepage, /intent_type:\s*'logo_paid_landing'/);
  assert.match(homepage, /clicked_dynamic_qr_cta/);
  assert.match(homepage, /clicked_pricing/);
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
  assert.match(html, /postBrandedDownloadCta/);
  assert.match(html, /Need to change details later\?/);
  assert.match(html, /Use an editable dynamic QR/);
  assert.match(html, /clicked_dynamic_qr_cta/);
  assert.match(html, /clicked_pricing/);
}

{
  const logoPage = read('logo-qr-code.html');
  assert.match(logoPage, /Need to edit after printing\?/);
}

{
  const bulk = read('bulk-qr-code.html');
  assert.match(bulk, /Create editable team QR codes/);
  assert.match(bulk, /Unlock 50 exports/);
  assert.match(bulk, /Unlock 500 exports/);
  assert.match(bulk, /Unlock unlimited exports/);
  assert.match(bulk, /postBulkExportCta/);
  assert.match(bulk, /Managing QR codes for a team\?/);
  assert.match(bulk, /clicked_dynamic_qr_cta/);
  assert.match(bulk, /pro_checkout_start/);
}

{
  const guide = read('dynamic-qr-guide.html');
  assert.match(guide, /\/analytics\.js/);
  assert.match(guide, /Create editable QR code/);
  assert.match(guide, /clicked_dynamic_qr_cta/);
  assert.doesNotMatch(guide, /dynamic_qr_cta_click/);
}

{
  const dynamicLanding = read('dynamic-qr-code-generator.html');
  assert.match(dynamicLanding, /Create an editable QR code/);
  assert.match(dynamicLanding, /clicked_dynamic_qr_cta/);
  assert.doesNotMatch(dynamicLanding, /dynamic_qr_cta_click/);
}

{
  const blogsIndex = read('blogs/index.html');
  assert.match(blogsIndex, /DAY4_CTA_TRACKING/);
  assert.match(blogsIndex, /clicked_pricing/);
  assert.match(blogsIndex, /logo_paid_landing/);
}

{
  const sampleBlog = read('blog/dynamic-qr-code-for-small-business/index.html');
  assert.match(sampleBlog, /DAY4_CTA_TRACKING/);
  assert.match(sampleBlog, /clicked_dynamic_qr_cta/);
  assert.match(sampleBlog, /Create an editable QR code/);
  assert.doesNotMatch(sampleBlog, /dynamic_qr_cta_click/);
}

{
  const dashboard = read('vcard-qr-next/src/app/dashboard/DashboardClient.tsx');
  assert.match(dashboard, /openPricingModal/);
  assert.match(dashboard, /dynamic_plan_modal/);
  assert.match(dashboard, /Start Starter: 5 editable QRs/);
  assert.match(dashboard, /Start Growth: 50 editable QRs/);
  assert.match(dashboard, /Start Business: unlimited editable QRs/);
}

{
  const generator = read('scripts/dynamic_seo_daily.py');
  assert.match(generator, /clicked_dynamic_qr_cta/);
  assert.match(generator, /Create an editable QR code/);
  assert.doesNotMatch(generator, /dynamic_qr_cta_click/);
  assert.doesNotMatch(generator, /Try dynamic QR codes/);
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
