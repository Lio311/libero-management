const fs = require('fs');
const path = './src/app/qc-inventory/qc-inventory-client.tsx';
let code = fs.readFileSync(path, 'utf8');

// We will replace the entire main content part starting from {/* Main Content */} to the end
// Let's just write a script to replace the component body.
