const fs = require('fs');
const path = require('path');

function checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file === 'node_modules' || file === '.git' || file === '.next') continue;
            checkDirectory(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                const importMatch = line.match(/from\s+['"](\.\/|\.\.\/)(.*?)['"]/);
                if (importMatch) {
                    const relativePath = importMatch[1] + importMatch[2];
                    const importDir = path.dirname(fullPath);
                    const targetPath = path.resolve(importDir, relativePath);

                    // Check if file exists with EXACT casing
                    const targetDir = path.dirname(targetPath);
                    const targetFile = path.basename(targetPath);

                    if (fs.existsSync(targetDir)) {
                        const actualFiles = fs.readdirSync(targetDir);
                        const match = actualFiles.find(f => f.toLowerCase() === (targetFile.toLowerCase() + '.tsx') || f.toLowerCase() === (targetFile.toLowerCase() + '.ts') || f.toLowerCase() === targetFile.toLowerCase());

                        if (match && match !== targetFile && match !== targetFile + '.tsx' && match !== targetFile + '.ts') {
                            console.log(`CASE MISMATCH in ${fullPath}:${i + 1}`);
                            console.log(`  Imported: ${targetFile}`);
                            console.log(`  Actual:   ${match}`);
                        }
                    }
                }
            });
        }
    }
}

checkDirectory('./src');
console.log('Done checking casing.');
