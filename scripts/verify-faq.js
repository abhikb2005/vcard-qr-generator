const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'p', 'real-estate-agent-new-york.html');
const content = fs.readFileSync(filePath, 'utf8');

const re = /application\/ld\+json">(.*?)<\/script>/;
const match = content.match(re);
if (match) {
  const parsed = JSON.parse(match[1]);
  console.log(JSON.stringify(parsed, null, 2));
} else {
  console.log('No FAQ schema found');
}
