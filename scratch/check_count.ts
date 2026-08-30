import { config } from 'dotenv';
config({ path: '.env' });
import { db } from '../src/lib/db';
import { wcOrders, velourOrders, laburaOrders } from '../src/lib/db/schema';
import { count, eq } from 'drizzle-orm';

async function check() {
  const c1 = await db.select({ value: count() }).from(wcOrders).where(eq(wcOrders.status, 'completed'));
  const c2 = await db.select({ value: count() }).from(velourOrders).where(eq(velourOrders.status, 'completed'));
  const c3 = await db.select({ value: count() }).from(laburaOrders).where(eq(laburaOrders.status, 'completed'));
  console.log('wc:', c1[0].value, 'velour:', c2[0].value, 'labura:', c3[0].value);
}
check();
