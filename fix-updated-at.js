const fs = require('fs');

const path = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(path, 'utf8');

// Update ScannerOrder type
code = code.replace(
  /export type ScannerOrder = \{[\s\S]*?hasMultipleOrdersToday\?: boolean;\n\};/,
  (match) => {
    return match.replace('hasMultipleOrdersToday?: boolean;', 'hasMultipleOrdersToday?: boolean;\n  updatedAt?: Date | string;');
  }
);

// Add updatedAt: targetOrders.updatedAt to selects
code = code.replace(
  /customerId: targetOrders.customerId,\n\s*\}\)/g,
  'customerId: targetOrders.customerId,\n      updatedAt: targetOrders.updatedAt,\n    })'
);

// Update mappedOrders mapping to include updatedAt
code = code.replace(
  /hasMultipleOrdersToday: false,/g,
  'hasMultipleOrdersToday: false,\n        updatedAt: order.updatedAt,'
);

fs.writeFileSync(path, code);
console.log('Fixed scanner-actions.ts');
