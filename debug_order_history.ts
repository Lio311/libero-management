import { db } from './src/lib/db';
import { wcOrders, velourOrders, laburaOrders } from './src/lib/db/schema';
import { getCustomerHistory } from './src/lib/customer-history';
import { eq } from 'drizzle-orm';

async function main() {
  const orderRecord = await db.select().from(wcOrders).where(eq(wcOrders.id, 54294)).limit(1);
  if (!orderRecord.length) {
    console.log("Order 54294 not found.");
    process.exit(1);
  }
  
  const order = orderRecord[0];
  const billing = order.billing as any;
  const email = billing?.email;
  const phone = billing?.phone;
  const currentTotal = order.total;
  const lineItems = order.lineItems;
  
  console.log("Order Details:");
  console.log(`- ID: ${order.id}`);
  console.log(`- Email: ${email}`);
  console.log(`- Phone: ${phone}`);
  console.log(`- Customer ID: ${order.customerId}`);
  console.log(`- Total: ${currentTotal}`);
  console.log(`- Line Items:`, JSON.stringify(lineItems, null, 2));

  const history = await getCustomerHistory(email, phone, order.customerId || undefined);
  
  console.log("\nHistory Details:");
  console.log(`- Total Orders: ${history.totalOrders}`);
  console.log(`- Total Spent: ${history.totalSpent}`);
  
  process.exit(0);
}

main().catch(console.error);
