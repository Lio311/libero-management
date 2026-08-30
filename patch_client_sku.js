const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `return (
      o.id.toString().includes(term) ||
      (o.customerName || '').toLowerCase().includes(term) ||
      (o.phone || '').includes(term) ||
      (o.shippingNumber || '').toLowerCase().includes(term) ||
      (o.shippingAddress || '').toLowerCase().includes(term)
    );`;
    
const replacement = `const lineItemsStr = JSON.stringify(o.lineItems || {}).toLowerCase();
    return (
      o.id.toString().includes(term) ||
      (o.customerName || '').toLowerCase().includes(term) ||
      (o.phone || '').includes(term) ||
      (o.shippingNumber || '').toLowerCase().includes(term) ||
      (o.shippingAddress || '').toLowerCase().includes(term) ||
      lineItemsStr.includes(term)
    );`;
code = code.replace(target, replacement);
fs.writeFileSync(file, code);
