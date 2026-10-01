const fs = require('fs');

const path = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace completedOrders sorting
code = code.replace(
  /const completedOrders = filteredOrders\.filter\(o => o\.status === 'completed'\)\.sort\(\(a, b\) => new Date\(b\.dateCreated\)\.getTime\(\) - new Date\(a\.dateCreated\)\.getTime\(\)\);/g,
  "const completedOrders = filteredOrders.filter(o => o.status === 'completed').sort((a, b) => new Date(b.updatedAt || b.dateCreated).getTime() - new Date(a.updatedAt || a.dateCreated).getTime());"
);

fs.writeFileSync(path, code);
console.log('Fixed scanner-list-client.tsx');
