import { config } from 'dotenv';
config({ path: '.env' });
import { db } from './src/lib/db/index';
import { wcOrders } from './src/lib/db/schema';

async function run() {
  const res = await db.select({
    id: wcOrders.id,
    dateCreated: wcOrders.dateCreated,
    lineItems: wcOrders.lineItems
  }).from(wcOrders).limit(5);
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
