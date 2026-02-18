const fs = require('fs');
const path = require('path');

// Load keywords data
const keywordsPath = path.join(__dirname, 'vcard-qr-next', 'data', 'keywords.json');
let keywords = [];

try {
    const rawData = fs.readFileSync(keywordsPath, 'utf8');
    keywords = JSON.parse(rawData);
} catch (error) {
    console.warn('Could not load keywords.json:', error.message);
}

const domain = 'https://www.vcardqrcodegenerator.com';
const lastmod = new Date().toISOString().split('T')[0];

const staticPages = [
    '',
    '/bulk-qr-code.html',
    '/logo-qr-code.html',
    '/vcard-qr-code-guide.html',
    '/privacy-policy.html',
    '/terms-of-service.html',
    '/contact.html',
    // Blog posts if known, e.g.,
    '/blog/qr-code-and-vcard-guide/'
];

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

// Static pages
console.log(`Adding ${staticPages.length} static pages...`);
staticPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${domain}${page}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '  </url>\n';
});

// pSEO pages
if (keywords.length > 0) {
    console.log(`Adding ${keywords.length} pSEO pages...`);
    keywords.forEach(k => {
        xml += '  <url>\n';
        xml += `    <loc>${domain}/p/${k.slug}/</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '  </url>\n';
    });
}

xml += '</urlset>';

const outputPath = path.join(__dirname, 'sitemap.xml');
fs.writeFileSync(outputPath, xml);
console.log(`sitemap.xml generated at ${outputPath}`);
