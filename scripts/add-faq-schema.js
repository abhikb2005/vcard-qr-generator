const fs = require('fs');
const path = require('path');

const pDir = path.join(__dirname, '..', 'p');
const files = fs.readdirSync(pDir).filter(f => 
  f.endsWith('.html') && f !== 'index.html' && f !== '404.html' && f !== '_not-found.html'
);

console.log(`Found ${files.length} pSEO pages to process.\n`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

files.forEach(file => {
  const filePath = path.join(pDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has FAQ JSON-LD
  if (content.includes('"FAQPage"')) {
    console.log(`SKIP: ${file} - already has FAQ schema`);
    skipCount++;
    return;
  }

  // Find FAQ section
  const faqStart = content.indexOf('Frequently Asked Questions');
  if (faqStart === -1) {
    console.log(`WARN: ${file} - no FAQ section found`);
    errorCount++;
    return;
  }

  // Extract FAQ section (limited scope)
  const faqSection = content.substring(faqStart, faqStart + 3000);

  // Extract questions and answers
  const qMatches = [...faqSection.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)];
  const aMatches = [...faqSection.matchAll(/<p class="text-gray-600">(.*?)<\/p>/g)];

  if (qMatches.length === 0) {
    console.log(`WARN: ${file} - no FAQ questions found`);
    errorCount++;
    return;
  }

  // Clean HTML from text (remove <!-- --> comments and tags)
  function cleanText(html) {
    return html
      .replace(/<!-- -->/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Build FAQ schema
  const faqEntities = [];
  for (let i = 0; i < qMatches.length; i++) {
    const question = cleanText(qMatches[i][1]);
    const answer = aMatches[i] ? cleanText(aMatches[i][1]) : '';
    if (question && answer) {
      faqEntities.push({
        "@type": "Question",
        "name": question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": answer
        }
      });
    }
  }

  if (faqEntities.length === 0) {
    console.log(`WARN: ${file} - could not extract Q&A pairs`);
    errorCount++;
    return;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqEntities
  };

  const scriptTag = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;

  // Insert before </head>
  const headEnd = content.indexOf('</head>');
  if (headEnd === -1) {
    console.log(`WARN: ${file} - no </head> tag found`);
    errorCount++;
    return;
  }

  content = content.substring(0, headEnd) + scriptTag + content.substring(headEnd);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`OK: ${file} - added ${faqEntities.length} FAQ items`);
  successCount++;
});

console.log(`\nDone! Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}`);
