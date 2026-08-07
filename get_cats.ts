import { db } from "./src/lib/db/index.js";
import { wcProducts } from "./src/lib/db/schema.js";

async function main() {
  const allWcProducts = await db.select({
    id: wcProducts.id,
    categories: wcProducts.categories,
  }).from(wcProducts);
  
  const uniqueCats = new Set<string>();
  
  for (const wp of allWcProducts) {
    if (wp.categories && Array.isArray(wp.categories)) {
      wp.categories.forEach((c: any) => {
        uniqueCats.add(c.name);
      });
    }
  }
  
  console.log(Array.from(uniqueCats).sort());
  process.exit(0);
}

main();
