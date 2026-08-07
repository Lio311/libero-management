import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './src/lib/db/index';
import { wcOrders, wcProducts } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function testOrders() {
  const orders = await db.select({
    dateCreated: wcOrders.dateCreated,
    lineItems: wcOrders.lineItems,
  }).from(wcOrders);
  
  console.log(`Found ${orders.length} orders.`);
  
  const sampleOrder = orders.find(o => o.lineItems && (o.lineItems as any[]).length > 0);
  if (sampleOrder) {
    console.log("Sample line items:", JSON.stringify(sampleOrder.lineItems, null, 2));
  }
  
  process.exit(0);
}
testOrders();
