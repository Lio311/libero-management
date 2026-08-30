const fs = require('fs');
const file = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(file, 'utf8');

const newAction = `
export async function searchScannerOrders(store: "libero" | "velour" | "labura", term: string): Promise<ScannerOrder[]> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  try {
    const termClean = term.replace(/[\\[\\]*]/g, '').trim().toLowerCase();
    if (!termClean) return [];

    // Search generatedShippingLabels first
    const labels = await db.select().from(generatedShippingLabels)
      .where(or(
        like(generatedShippingLabels.barcode, \`%\${termClean}%\`),
        like(generatedShippingLabels.orderId, \`%\${termClean}%\`)
      ))
      .limit(50);
      
    const orderIdsFromLabels = labels.map(l => {
      const id = l.orderId?.split('-')[0];
      return id ? parseInt(id, 10) : 0;
    }).filter(id => id > 0);

    const isNumeric = /^\\d+$/.test(termClean);
    const searchId = isNumeric ? parseInt(termClean, 10) : 0;

    // We can't search JSON easily in Drizzle without specific dialect, so we fetch recent 2000 and filter in JS if it's not an ID match
    // Or we just fetch if ID matches
    
    let dbOrders = [];
    if (searchId > 0 || orderIdsFromLabels.length > 0) {
      const idsToSearch = [];
      if (searchId > 0) idsToSearch.push(searchId);
      if (orderIdsFromLabels.length > 0) idsToSearch.push(...orderIdsFromLabels);
      
      dbOrders = await db.select({
        id: targetOrders.id,
        total: targetOrders.total,
        dateCreated: targetOrders.dateCreated,
        status: targetOrders.status,
        lineItems: targetOrders.lineItems,
        shippingLines: targetOrders.shippingLines,
        billing: targetOrders.billing,
        customerId: targetOrders.customerId,
      }).from(targetOrders)
      .where(inArray(targetOrders.id, idsToSearch));
    }
    
    // Also we should search by name/phone in the database if possible? 
    // billing is a JSONB. 
    // To keep it simple and safe for Drizzle SQLite/PG compatibility, if it's not numeric, we might just return empty for now,
    // OR we fetch recent 1000 orders and filter in JS.
    if (!isNumeric && termClean.length > 2) {
       const recent = await db.select({
          id: targetOrders.id,
          total: targetOrders.total,
          dateCreated: targetOrders.dateCreated,
          status: targetOrders.status,
          lineItems: targetOrders.lineItems,
          shippingLines: targetOrders.shippingLines,
          billing: targetOrders.billing,
          customerId: targetOrders.customerId,
        }).from(targetOrders)
        .orderBy(desc(targetOrders.dateCreated))
        .limit(1000);
        
       const matched = recent.filter(o => {
         const bill = o.billing as any;
         const name = ((bill?.first_name || '') + ' ' + (bill?.last_name || '')).toLowerCase();
         const phone = (bill?.phone || '').toLowerCase();
         return name.includes(termClean) || phone.includes(termClean);
       });
       
       const existingIds = new Set(dbOrders.map(o => o.id));
       for (const m of matched) {
         if (!existingIds.has(m.id)) dbOrders.push(m);
       }
    }

    const finalIdsStr = dbOrders.map(o => o.id.toString());
    const finalLabels = finalIdsStr.length > 0 
      ? await db.select({ orderId: generatedShippingLabels.orderId, barcode: generatedShippingLabels.barcode }).from(generatedShippingLabels).where(inArray(generatedShippingLabels.orderId, finalIdsStr))
      : [];
    const labelMap = new Map(finalLabels.map(l => [l.orderId, l.barcode]));

    return dbOrders.map(order => {
      const billing = order.billing as any;
      const label = labelMap.get(order.id.toString());
      return {
        ...order,
        shippingNumber: label ? label.barcode : null,
        shippingAddress: billing ? \`\${billing.city || ''} \${billing.address_1 || ''}\`.trim() : null,
        customerName: billing ? \`\${billing.first_name || ''} \${billing.last_name || ''}\`.trim() : null,
        phone: billing ? billing.phone : null,
        isPickup: (order.shippingLines as any[])?.some((line: any) => line.method_id === "local_pickup") || false
      };
    });
  } catch(e) {
    console.error("searchScannerOrders error:", e);
    return [];
  }
}
`;

code = code + newAction;
fs.writeFileSync(file, code);
