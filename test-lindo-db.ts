import { db } from "./src/lib/db";
import { scannedWholesaleProducts } from "./src/lib/db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const products = await db.select().from(scannedWholesaleProducts).orderBy(desc(scannedWholesaleProducts.scannedAt)).limit(5);
  console.log("Recent products in DB:", products);
  process.exit(0);
}
run().catch(console.error);
