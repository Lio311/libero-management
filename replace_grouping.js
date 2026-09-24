const fs = require('fs');
const content = fs.readFileSync('src/app/shipping-scanner/scanner-list-client.tsx', 'utf8');

const regex = /const processingOrders = filteredOrders\.filter\(o => o\.status === 'processing'\);\n  const completedOrders = filteredOrders\.filter\(o => o\.status === 'completed'\);\n  \n  const readyOrders = processingOrders\.filter\(o => readyIds\.includes\(o\.id\)\);\n  const partialOrders = processingOrders\.filter\(o => partiallyScannedIds\.includes\(o\.id\) && !readyIds\.includes\(o\.id\)\);\n  const pickupOrders = processingOrders\.filter\(o => o\.isPickup && !partiallyScannedIds\.includes\(o\.id\) && !readyIds\.includes\(o\.id\)\);\n  const allShippingOrders = processingOrders\.filter\(o => !o\.isPickup && !partiallyScannedIds\.includes\(o\.id\) && !readyIds\.includes\(o\.id\)\);/;

const newCode = `const processingOrders = filteredOrders.filter(o => o.status === 'processing');
  const completedOrders = filteredOrders.filter(o => o.status === 'completed');

  // Logic for duplicates category
  const phoneCounts = new Map<string, number>();
  processingOrders.forEach(o => {
    const phone = o.billing?.phone;
    if (phone) {
      const key = phone.replace(/\\D/g, '');
      phoneCounts.set(key, (phoneCounts.get(key) || 0) + 1);
    }
  });

  const duplicatePhones = new Set(
    Array.from(phoneCounts.entries()).filter(([phone, count]) => count > 1).map(([phone]) => phone)
  );

  const duplicateOrdersRaw = processingOrders.filter(o => {
    const p = o.billing?.phone;
    return p && duplicatePhones.has(p.replace(/\\D/g, ''));
  });
  
  const duplicateOrders = duplicateOrdersRaw.sort((a, b) => {
    const phoneA = (a.billing?.phone || '').replace(/\\D/g, '');
    const phoneB = (b.billing?.phone || '').replace(/\\D/g, '');
    if (phoneA === phoneB) {
      return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
    }
    return phoneA.localeCompare(phoneB);
  });

  const normalProcessingOrders = processingOrders.filter(o => {
    const p = o.billing?.phone;
    return !(p && duplicatePhones.has(p.replace(/\\D/g, '')));
  });

  const readyOrders = normalProcessingOrders.filter(o => readyIds.includes(o.id));
  const partialOrders = normalProcessingOrders.filter(o => partiallyScannedIds.includes(o.id) && !readyIds.includes(o.id));
  const pickupOrders = normalProcessingOrders.filter(o => o.isPickup && !partiallyScannedIds.includes(o.id) && !readyIds.includes(o.id));
  const allShippingOrders = normalProcessingOrders.filter(o => !o.isPickup && !partiallyScannedIds.includes(o.id) && !readyIds.includes(o.id));`;

fs.writeFileSync('src/app/shipping-scanner/scanner-list-client.tsx', content.replace(regex, newCode));
