const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://dummy:dummy@dummy.neon.tech/dummy' });

async function run() {
  try {
    const tables = ['generated_shipping_labels', 'print_jobs'];
    for (const table of tables) {
      const res = await pool.query(`SELECT * FROM ${table}::text WHERE ${table}::text LIKE '%YXVSNLRKCC%'`);
      console.log(`Found in ${table}:`, res.rows.length);
      if (res.rows.length) console.log(res.rows[0]);
    }
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    pool.end();
  }
}
run();
