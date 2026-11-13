const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

test('WebMCP accepts synthetic contact data without overwriting a draft or returning contact data', async () => {
  let tool;
  const window = {};
  vm.runInNewContext(readFileSync('webmcp-vcard.js', 'utf8'), {
    window, document: { modelContext: { registerTool(value) { tool = value; } } }, navigator: {}
  });
  const fields = Object.fromEntries(['fullName', 'phone', 'email', 'website', 'company', 'title'].map(id => [id, { id, value: '' }]));
  let renders = 0;
  await window.registerVcardBrowserTool({ form: { querySelector: key => fields[key.slice(1)] }, generate: () => ++renders > 0 });
  const run = input => tool.execute(input).content[0].text;
  assert.match(run({ fullName: 'Demo\nEND:VCARD' }), /single-line/);
  assert.equal(renders, 0);
  assert.match(run({ fullName: 'Synthetic Example', email: 'demo@example.com' }), /Download/);
  assert.equal(fields.email.value, 'demo@example.com');
  assert.match(run({ fullName: 'Another person' }), /already contains/);
  assert.equal(fields.fullName.value, 'Synthetic Example');
  assert.equal(renders, 1);
  fields.fullName.value = '';
  fields.email.value = '';
  await window.registerVcardBrowserTool({ form: { querySelector: key => fields[key.slice(1)] }, generate: () => false });
  assert.match(run({ fullName: 'Failure example' }), /could not/);
  assert.equal(fields.fullName.value, '');
});

test('public catalog serves a discoverable linkset on both site hosts', async () => {
  const source = readFileSync('workers/router.js', 'utf8');
  const worker = vm.runInNewContext(source.replace(/^import .*;$/gm, '').replace('export default {', 'const worker = {') + '\nworker', { Request, Response, Headers, URL });
  for (const host of ['www.vcardqrcodegenerator.com', 'vcardqrcodegenerator.com']) {
    const url = 'https://' + host + '/.well-known/api-catalog';
    const res = await worker.fetch(new Request(url), {}, {});
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /^application\/linkset\+json/);
    const body = await res.json();
    assert.deepEqual(body, JSON.parse(readFileSync(".well-known/api-catalog", "utf8")));
    const { linkset: [catalog, api] } = body;
    assert.equal(catalog.anchor, "https://vcardqrcodegenerator.com/.well-known/api-catalog");
    assert.equal(catalog.item[0].href, api.anchor);
    assert.equal(api['service-desc'][0].href, 'https://www.vcardqrcodegenerator.com/openapi.json');
    const head = await worker.fetch(new Request(url, { method: 'HEAD' }), {}, {});
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal((await worker.fetch(new Request(url, { method: 'POST' }), {}, {})).status, 405);
  }
  const home = await worker.fetch(new Request('https://www.vcardqrcodegenerator.com/', { headers: { Accept: 'text/markdown' } }), {}, {});
  assert.equal(home.status, 200);
  assert.match(home.headers.get('link') || '', /rel="api-catalog"/);
});
