const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const preferredHost = 'https://www.vcardqrcodegenerator.com';

test('the committed sitemap contains only preferred-host URLs', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

  assert.ok(urls.length > 0, 'sitemap must contain URLs');
  assert.ok(urls.every((url) => url.startsWith(preferredHost)), 'sitemap must use the www canonical host');
});

test('robots advertises only the preferred sitemap URL', () => {
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  const sitemapLines = robots.split(/\r?\n/).filter((line) => line.toLowerCase().startsWith('sitemap:'));

  assert.deepEqual(sitemapLines, [`Sitemap: ${preferredHost}/sitemap.xml`]);
});
