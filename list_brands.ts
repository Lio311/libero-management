import { db } from './src/lib/db';
import { wcProducts } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const products = await db.select({ name: wcProducts.name }).from(wcProducts);
  const brands = new Set<string>();
  
  for (const p of products) {
    if (!p.name) continue;
    // Extract first word, maybe two if they are short
    // Actually, just listing prefixes or using a known list is better.
    // Let's print out a few distinct names to see the structure.
  }
  
  // A better way: just group by the first word of the name
  const grouped = await db.execute(sql`
    SELECT split_part(name, ' ', 1) as brand, COUNT(*) as count
    FROM wc_products
    WHERE name IS NOT NULL
    GROUP BY brand
    ORDER BY count DESC
    LIMIT 100
  `);
  
  for (const row of grouped.rows) {
    console.log(`${row.brand}: ${row.count}`);
  }
  
  process.exit(0);
}
main().catch(console.error);
