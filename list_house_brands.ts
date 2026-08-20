import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const prods = await db.execute(sql`
    SELECT name, categories
    FROM wc_products
    WHERE categories::text LIKE '%"id":268%' OR categories::text LIKE '%"name":"מותגי הבית"%'
  `);
  
  const houseBrands = new Set();
  for (const row of prods.rows) {
    const name = row.name as string;
    const brand = name.split(' ')[0]; // rough extraction
    houseBrands.add(brand);
  }
  console.log("House Brands detected in wc_products:");
  console.log(Array.from(houseBrands));
  
  const luxuryProds = await db.execute(sql`
    SELECT name
    FROM wc_products
    WHERE categories::text LIKE '%"id":287%' OR categories::text LIKE '%"name":"בשמי יוקרה"%'
  `);
  
  const luxuryBrands = new Set();
  for (const row of luxuryProds.rows) {
    const name = row.name as string;
    const brand = name.split(' ')[0]; // rough extraction
    luxuryBrands.add(brand);
  }
  console.log("\nLuxury Brands detected in wc_products (subset):");
  console.log(Array.from(luxuryBrands).slice(0, 30));

  process.exit(0);
}
main().catch(console.error);
