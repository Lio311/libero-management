const fs = require('fs');

const path = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /customerId: wcOrder\.customer_id\?\.toString\(\),\n\s*\}\);/g,
  "customerId: wcOrder.customer_id?.toString(),\n                   updatedAt: wcOrder.date_modified_gmt ? new Date(wcOrder.date_modified_gmt + 'Z') : new Date(wcOrder.date_modified || new Date()),\n                 });"
);

fs.writeFileSync(path, code);
console.log('Fixed scanner-actions.ts fallback');
