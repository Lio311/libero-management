import { config } from 'dotenv';
config({ path: '.env' });
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  const res = await pool.query("SELECT id, status FROM velour_orders WHERE id = 27441267");
  console.log("Order in Velour:", res.rows);
  
  const res2 = await pool.query("SELECT id, status FROM wc_orders WHERE id = 27441267");
  if (res2.rows.length) console.log("Order in Libero:", res2.rows);
  
  const res3 = await pool.query("SELECT id, status FROM labura_orders WHERE id = 27441267");
  if (res3.rows.length) console.log("Order in Labura:", res3.rows);
}
check().catch(console.error).finally(() => pool.end());
