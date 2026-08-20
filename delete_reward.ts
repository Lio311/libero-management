import { db } from './src/lib/db';
import { orderRewards } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';
async function main() {
  await db.delete(orderRewards).where(eq(orderRewards.orderId, 54294));
  console.log("Deleted cached reward for 54294");
  process.exit(0);
}
main().catch(console.error);
