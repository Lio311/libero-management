const fs = require('fs');
const file = '/Users/liorzafrir/.gemini/antigravity/brain/13fba76a-1f5a-4ed7-a247-e94e97e0c708/scratch/libero-print-daemon/print-daemon.js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /await page\.goto\(targetUrl, \{ waitUntil: 'networkidle0', timeout: 30000 \}\);/,
  `await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.log('    [Page Goto]', e.message));`
);

fs.writeFileSync(file, code);
