const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `const term = searchTerm.toLowerCase();`;
const replacement = `const term = searchTerm.toLowerCase().replace(/[\\[\\]*]/g, '');`;
code = code.replace(target, replacement);

fs.writeFileSync(file, code);
