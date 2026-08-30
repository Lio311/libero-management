import { config } from 'dotenv';
config({ path: '.env' });
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const res = await pool.query("SELECT id, line_items FROM velour_orders ORDER BY date_created DESC LIMIT 500");
  for (const row of res.rows) {
    const items = row.line_items || [];
    for (const item of items) {
      if (JSON.stringify(item).toLowerCase().includes("e744")) {
        console.log("Found in Velour Order:", row.id, item.name, item.sku);
      }
    }
  }
  
  const res2 = await pool.query("SELECT id, line_items FROM wc_orders ORDER BY date_created DESC LIMIT 500");
  for (const row of res2.rows) {
    const items = row.line_items || [];
    for (const item of items) {
      if (JSON.stringify(item).toLowerCase().includes("e744")) {
        console.log("Found in Libero Order:", row.id, item.name, item.sku);
      }
    }
  }
}
run().catch(console.error).finally(() => pool.end());
