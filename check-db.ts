import { db } from './src/lib/db/index.js';
import { wc_orders } from './src/lib/db/schema.js';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_orders,
        MIN(date_created) as oldest_order,
        MAX(date_created) as newest_order
      FROM wc_orders
    `);
    console.log('Order Stats:', result.rows[0]);
    
    // check top 5 oldest orders to see if it fetched older items
    const oldest = await db.execute(sql`
      SELECT id, date_created 
      FROM wc_orders 
      ORDER BY date_created ASC 
      LIMIT 5
    `);
    console.log('Oldest 5 orders:', oldest.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
