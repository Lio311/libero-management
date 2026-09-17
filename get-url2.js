const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://dummy:dummy@dummy.neon.tech/dummy' });

async function run() {
  try {
    const res = await pool.query("SELECT label_url FROM generated_shipping_labels WHERE barcode = 'YXVSNLRKCC'");
    console.log('URL for bottom label:', res.rows[0]?.label_url);
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    pool.end();
  }
}
run();
