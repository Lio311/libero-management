import { db } from './src/lib/db';
import { categories, wcProducts } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const cats = await db.select().from(categories);
  console.log("Categories Table:");
  for (const c of cats) {
    console.log(`- ${c.name} (ID: ${c.id})`);
  }
  
  // Let's also check if wcProducts has categories stored in them or some tags
  const prod = await db.execute(sql`
    SELECT id, name, category, categories
    FROM wc_products
    LIMIT 5
  `);
  console.log("\nwcProducts schema fields (example):");
  console.log(prod.rows);
  
  process.exit(0);
}
main().catch(console.error);
