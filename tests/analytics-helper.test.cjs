const assert = require('assert');

function setupWindow(gtag) {
  const storage = new Map();
  global.window = global;
  global.location = {
    hostname: 'localhost',
    pathname: '/test',
    href: 'http://localhost/test'
  };
  global.document = { title: 'Analytics Test' };
  global.localStorage = {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  };
  global.gtag = gtag;
  delete require.cache[require.resolve('../analytics.js')];
  return require('../analytics.js');
}

{
  const analytics = setupWindow(undefined);
  assert.doesNotThrow(() => analytics.trackEvent('missing_gtag_safe', { ok: true }));
}

{
  const calls = [];
  const analytics = setupWindow((...args) => calls.push(args));
  analytics.trackEvent('generated_qr_code', { qr_type: 'static_vcard' });
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0][0], 'event');
  assert.strictEqual(calls[0][1], 'generated_qr_code');
  assert.strictEqual(calls[0][2].qr_type, 'static_vcard');
  assert.strictEqual(calls[0][2].page_path, '/test');
}

{
  const calls = [];
  const analytics = setupWindow((...args) => calls.push(args));
  const params = {
    transaction_id: 'txn_test_1',
    value: 4.99,
    currency: 'USD',
    items: [{ item_id: 'logo_vcard_one_time', item_name: 'Logo vCard QR Code', quantity: 1 }]
  };
  assert.strictEqual(analytics.trackPurchase(params), true);
  assert.strictEqual(analytics.trackPurchase(params), false);
  assert.deepStrictEqual(calls.map((call) => call[1]), ['purchase', 'payment_success']);
  assert.strictEqual(calls[0][2].value, 4.99);
  assert.strictEqual(calls[0][2].currency, 'USD');
  assert.strictEqual(calls[0][2].items[0].price, 4.99);
  assert.strictEqual(calls[0][2].items[0].quantity, 1);
}

console.log('analytics helper tests passed');
