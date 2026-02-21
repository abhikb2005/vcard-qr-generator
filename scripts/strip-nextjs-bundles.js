const fs = require('fs');
const path = require('path');

const pDir = path.join(__dirname, '..', 'p');
const files = fs.readdirSync(pDir).filter(f => 
  f.endsWith('.html') && f !== 'index.html' && f !== '404.html' && f !== '_not-found.html'
);

console.log(`Stripping Next.js bundles from ${files.length} pSEO pages...\n`);

let totalRemoved = 0;

files.forEach(file => {
  const filePath = path.join(pDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalLength = content.length;

  // Remove <script src="/_next/..."> tags (external JS bundles)
  content = content.replace(/<script src="\/_next\/static\/chunks\/[^"]*"[^>]*><\/script>/g, '');

  // Remove <link rel="preload" as="script" ...> tags (preload hints for JS)
  content = content.replace(/<link rel="preload" as="script"[^>]*>/g, '');

  // Remove inline Next.js hydration scripts like (self.__next_f=...)
  content = content.replace(/<script>\(self\.__next_f=self\.__next_f\|\|\[\]\)\.push\([^)]*\)<\/script>/g, '');
  content = content.replace(/<script>self\.__next_f\.push\(\[1,[^\]]*\]\)<\/script>/g, '');

  // Remove all remaining self.__next_f inline scripts (they can be multi-line in minified form)
  content = content.replace(/<script>self\.__next_f\.push\(.*?\)<\/script>/g, '');

  // Remove the hidden div used for React hydration
  content = content.replace(/<div hidden=""><!--\$--><!--\/\$--><\/div>/g, '');

  // Remove noModule script tags
  content = content.replace(/<script src="\/_next\/[^"]*" noModule=""><\/script>/g, '');

  // Clean up any double spaces in tags
  content = content.replace(/  +/g, ' ');

  const saved = originalLength - content.length;
  totalRemoved += saved;

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`${file}: removed ${saved} bytes (${((saved/originalLength)*100).toFixed(1)}%)`);
});

console.log(`\nTotal bytes removed: ${totalRemoved} (${(totalRemoved/1024).toFixed(1)} KB)`);
