const fs = require('fs');
const file = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(file, 'utf8');

code += `\n\nexport async function fixShippingLabelsDb() {
  try {
    const labels = await db.select().from(generatedShippingLabels);
    let fixedCount = 0;
    
    for (const label of labels) {
      if (label.orderId && label.orderId.includes('-')) {
        const realId = label.orderId.split('-')[0];
        if (/^\\d+$/.test(realId)) {
          await db.update(generatedShippingLabels)
            .set({ orderId: realId })
            .where(eq(generatedShippingLabels.id, label.id));
          fixedCount++;
        }
      }
    }
    return { success: true, fixedCount };
  } catch(e) {
    console.error(e);
    return { success: false };
  }
}
`;

fs.writeFileSync(file, code);
