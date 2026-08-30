const fs = require('fs');
const file = 'src/app/actions/scanner-actions.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('shippingNumber?: string;')) {
    code = code.replace(
        /gender\?\:\s*'male'\s*\|\s*'female'\s*\|\s*'unknown';/,
        `gender?: 'male' | 'female' | 'unknown';\n  shippingNumber?: string;`
    );
}

if (!code.includes('import { inArray } from "drizzle-orm"')) {
    code = code.replace(
        /import\s*\{\s*eq,\s*desc\s*\}\s*from\s*"drizzle-orm";/,
        `import { eq, desc, inArray } from "drizzle-orm";`
    );
}

// Add query for labels inside getProcessingOrders
if (!code.includes('const labels = orderIds.length > 0')) {
    code = code.replace(
        /const orders = \[\.\.\.processingOrders, \.\.\.completedOrders\];/,
        `const orders = [...processingOrders, ...completedOrders];\n\n    const orderIdsStr = orders.map(o => o.id.toString());\n    const labels = orderIdsStr.length > 0 \n      ? await db.select({ orderId: generatedShippingLabels.orderId, barcode: generatedShippingLabels.barcode }).from(generatedShippingLabels).where(inArray(generatedShippingLabels.orderId, orderIdsStr))\n      : [];\n    const labelMap = new Map(labels.map(l => [l.orderId, l.barcode]));`
    );
}

if (!code.includes('shippingNumber: labelMap.get(order.id.toString()) ||')) {
    code = code.replace(
        /gender:\s*guessGender\(billing\?\.first_name\s*\|\|\s*''\),/,
        `gender: guessGender(billing?.first_name || ''),\n        shippingNumber: labelMap.get(order.id.toString()) || '',`
    );
}

fs.writeFileSync(file, code);
