const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const importTarget = `import { ScannerOrder, createOrderLabel, getArchivedCompletedOrders } from "@/app/actions/scanner-actions";`;
const importReplacement = `import { ScannerOrder, createOrderLabel, getArchivedCompletedOrders, fixShippingLabelsDb } from "@/app/actions/scanner-actions";`;
code = code.replace(importTarget, importReplacement);

fs.writeFileSync(file, code);
