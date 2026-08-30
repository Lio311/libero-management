const fs = require('fs');
const file = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/let dbOrders = \[\];/g, 'let dbOrders: any[] = [];');
code = code.replace(/shippingNumber: label \? label\.barcode : null/g, 'shippingNumber: label ? label : null');

fs.writeFileSync(file, code);
