const fs = require('fs');
const file = 'src/app/api/lionwheel/create-labels/route.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `          await db.insert(generatedShippingLabels).values({
            orderId: payload.original_order_id,
            customerId: customer.id?.toString() || "",`;

const replacement = `          await db.insert(generatedShippingLabels).values({
            orderId: (customer.latestOrderId || customer.id).toString(),
            customerId: customer.id?.toString() || "",`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
