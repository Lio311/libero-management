import { db } from "./src/lib/db";
import { wcProducts } from "./src/lib/db/schema";

async function main() {
  try {
    const products = await db.select({ name: wcProducts.name }).from(wcProducts);
    
    // Extract potential brands (first word or two of the name)
    const brandCounts: Record<string, number> = {};
    products.forEach(p => {
      const name = p.name || '';
      // We will just collect all names and let Node print the first 100 unique ones
    });
    
    const uniqueNames = Array.from(new Set(products.map(p => p.name))).filter(Boolean);
    console.log(`Total unique products: ${uniqueNames.length}`);
    console.log(uniqueNames.slice(0, 150));
    
    process.exit(0);
  } catch(e) {
    console.error(e);
  }
}
main();
