import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const prod = await db.execute(sql`
    SELECT categories
    FROM wc_products
    WHERE categories IS NOT NULL
    LIMIT 10
  `);
  console.log(JSON.stringify(prod.rows, null, 2));
  process.exit(0);
}
main().catch(console.error);
