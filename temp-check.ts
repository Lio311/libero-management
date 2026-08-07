import { db } from "./src/lib/db";
import { wcOrders } from "./src/lib/db/schema";
import { isNotNull, isNull, count } from "drizzle-orm";

async function main() {
  const withBilling = await db.select({ count: count() }).from(wcOrders).where(isNotNull(wcOrders.billing));
  const withoutBilling = await db.select({ count: count() }).from(wcOrders).where(isNull(wcOrders.billing));
  
  console.log("With billing:", withBilling[0].count);
  console.log("Without billing:", withoutBilling[0].count);
  process.exit(0);
}
main();
