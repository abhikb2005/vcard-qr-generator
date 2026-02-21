const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const issues = [];

// 1. Check pSEO pages for Next.js bundle scripts
console.log('=== Checking pSEO pages for Next.js JS bundles ===');
const pDir = path.join(root, 'p');
const pFiles = fs.readdirSync(pDir).filter(f => f.endsWith('.html') && f !== 'index.html' && f !== '404.html' && f !== '_not-found.html');
pFiles.forEach(f => {
  const content = fs.readFileSync(path.join(pDir, f), 'utf8');
  const scripts = (content.match(/<script\s+src="[^"]*"/g) || []);
  if (scripts.length > 0) {
    console.log(`  ${f}: ${scripts.length} external scripts`);
    scripts.forEach(s => console.log(`    ${s}`));
  }
});

// 2. Check for missing alt tags on images across site
console.log('\n=== Checking for images without alt tags ===');
function checkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== '_next' && entry.name !== 'node_modules') {
      checkDir(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
      const imgs = content.match(/<img\s[^>]*>/g) || [];
      imgs.forEach(img => {
        if (!img.includes('alt=')) {
          const relPath = path.relative(root, path.join(dir, entry.name));
          console.log(`  Missing alt: ${relPath}`);
          console.log(`    ${img.substring(0, 150)}`);
          issues.push({ type: 'missing-alt', file: relPath, tag: img });
        }
      });
    }
  });
}
checkDir(root);

// 3. Check for broken internal links
console.log('\n=== Checking for localhost or broken URLs ===');
function checkUrls(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== '_next' && entry.name !== 'node_modules') {
      checkUrls(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
      const relPath = path.relative(root, path.join(dir, entry.name));
      
      // Check for localhost URLs
      if (content.includes('localhost')) {
        console.log(`  LOCALHOST found: ${relPath}`);
        issues.push({ type: 'localhost', file: relPath });
      }
      
      // Check for http:// (should be https://)
      const httpMatches = content.match(/href="http:\/\/(?!localhost)/g) || [];
      if (httpMatches.length > 0) {
        console.log(`  HTTP (non-HTTPS) links: ${relPath} (${httpMatches.length})`);
        issues.push({ type: 'http-link', file: relPath, count: httpMatches.length });
      }
    }
  });
}
checkUrls(root);

// 4. Check for missing canonical tags
console.log('\n=== Checking for missing canonical tags ===');
function checkCanonical(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== '_next' && entry.name !== 'node_modules' && entry.name !== '.wrangler') {
      checkCanonical(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
      const relPath = path.relative(root, path.join(dir, entry.name));
      if (!content.includes('rel="canonical"') && !content.includes("rel='canonical'")) {
        console.log(`  Missing canonical: ${relPath}`);
        issues.push({ type: 'missing-canonical', file: relPath });
      }
    }
  });
}
checkCanonical(root);

// 5. Check for missing meta descriptions
console.log('\n=== Checking for missing meta descriptions ===');
function checkMeta(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== '_next' && entry.name !== 'node_modules' && entry.name !== '.wrangler') {
      checkMeta(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.html')) {
      const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
      const relPath = path.relative(root, path.join(dir, entry.name));
      if (!content.includes('name="description"')) {
        console.log(`  Missing meta description: ${relPath}`);
        issues.push({ type: 'missing-description', file: relPath });
      }
    }
  });
}
checkMeta(root);

console.log(`\nTotal issues found: ${issues.length}`);
