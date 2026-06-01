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
}

console.log('analytics HTML contract tests passed');
