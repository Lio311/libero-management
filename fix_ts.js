const fs = require('fs');
let content = fs.readFileSync('src/app/actions/scanner-actions.ts', 'utf8');
content = content.replace(/const p = order\.phone || \(order\.billing as any\)\?\.phone;/, 'const p = order.phone;');
fs.writeFileSync('src/app/actions/scanner-actions.ts', content);
