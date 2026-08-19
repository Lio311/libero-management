import { db } from "./src/lib/db";
import { scannedWholesaleProducts } from "./src/lib/db/schema";
import { desc } from "drizzle-orm";

async function main() {
  const recent = await db.select().from(scannedWholesaleProducts).orderBy(desc(scannedWholesaleProducts.scannedAt)).limit(10);
  console.log(recent);
  process.exit(0);
}
main();
