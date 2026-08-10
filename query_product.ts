import { db } from "./src/lib/db";
import { qcProducts, wcProducts } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const product = await db.select().from(wcProducts).where(eq(wcProducts.sku, '5214002848156')).limit(1);
  if (product.length > 0) {
    console.log("WC Product:", product[0]);
    const qc = await db.select().from(qcProducts).where(eq(qcProducts.wooProductId, product[0].id)).limit(1);
    console.log("QC Product:", qc.length > 0 ? qc[0] : "Not found");
  } else {
    console.log("Product not found");
  }
}

run().catch(console.error);
