const fs = require('fs');
const content = fs.readFileSync('src/app/actions/scanner-actions.ts', 'utf8');

const regex = /async function computeMultipleOrdersToday\([\s\S]*?return \{ \.\.\.order, hasMultipleOrdersToday: hasMultiple \};\n  \}\);\n\}/;

const newCode = `async function computeMultipleOrdersToday(orders: ScannerOrder[], store: "libero" | "velour" | "labura") {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  
  const activeOrders = await db.select({
    phone: sql<string>\`billing->>'phone'\`
  }).from(targetOrders).where(
    eq(targetOrders.status, 'processing')
  );

  const phoneCounts = new Map<string, number>();
  for (const row of activeOrders) {
    const p = row.phone;
    if (p) {
      const key = p.replace(/\\D/g, '');
      phoneCounts.set(key, (phoneCounts.get(key) || 0) + 1);
    }
  }

  return orders.map(order => {
    let hasMultiple = false;
    if (order.status === 'processing') {
      const p = order.phone || (order.billing as any)?.phone;
      if (p) {
        const key = p.replace(/\\D/g, '');
        if ((phoneCounts.get(key) || 0) > 1) {
          hasMultiple = true;
        }
      }
    }
    return { ...order, hasMultipleOrdersToday: hasMultiple };
  });
}`;

fs.writeFileSync('src/app/actions/scanner-actions.ts', content.replace(regex, newCode));
