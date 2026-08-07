import { db } from "./src/lib/db/index.js";
import { wcProducts } from "./src/lib/db/schema.js";

async function main() {
  const allWcProducts = await db.select({
    id: wcProducts.id,
    categories: wcProducts.categories,
  }).from(wcProducts).limit(3);
  
  console.log(JSON.stringify(allWcProducts, null, 2));
  process.exit(0);
}

main();
