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
    '/blogs/',
];

// Auto-discover blog posts from blog/ directory
const blogDir = path.join(__dirname, 'blog');
let blogPosts = [];
try {
    blogPosts = fs.readdirSync(blogDir)
        .filter(entry => fs.statSync(path.join(blogDir, entry)).isDirectory())
        .filter(entry => fs.existsSync(path.join(blogDir, entry, 'index.html')))
        .map(entry => `/blog/${entry}/`);
    console.log(`Found ${blogPosts.length} blog posts`);
} catch (error) {
    console.warn('Could not scan blog directory:', error.message);
}

// pSEO alternatives & industries pages
const pSeoExtra = [];
const altDir = path.join(__dirname, 'p', 'alternatives');
const indDir = path.join(__dirname, 'p', 'industries');
try {
    if (fs.existsSync(altDir)) {
        fs.readdirSync(altDir)
            .filter(f => f.endsWith('.html'))
            .forEach(f => pSeoExtra.push(`/p/alternatives/${f.replace('.html', '')}/`));
    }
    if (fs.existsSync(indDir)) {
        fs.readdirSync(indDir)
            .filter(f => f.endsWith('.html'))
            .forEach(f => pSeoExtra.push(`/p/industries/${f.replace('.html', '')}/`));
    }
} catch (error) {
    console.warn('Could not scan p/ subdirectories:', error.message);
}

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

// Blog posts
if (blogPosts.length > 0) {
    console.log(`Adding ${blogPosts.length} blog posts...`);
    blogPosts.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${domain}${page}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '  </url>\n';
    });
}

// pSEO job+city pages
if (keywords.length > 0) {
    console.log(`Adding ${keywords.length} pSEO pages...`);
    keywords.forEach(k => {
        xml += '  <url>\n';
        xml += `    <loc>${domain}/p/${k.slug}/</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '  </url>\n';
    });
}

// pSEO alternatives & industries pages
if (pSeoExtra.length > 0) {
    console.log(`Adding ${pSeoExtra.length} pSEO extra pages...`);
    pSeoExtra.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${domain}${page}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '  </url>\n';
    });
}

xml += '</urlset>';

const outputPath = path.join(__dirname, 'sitemap.xml');
fs.writeFileSync(outputPath, xml);
console.log(`sitemap.xml generated at ${outputPath}`);
