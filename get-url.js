const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://dummy:dummy@dummy.neon.tech/dummy' });

async function run() {
  try {
    const res = await pool.query('SELECT label_url FROM generated_shipping_labels WHERE label_url LIKE \'%lionwheel.com%\' ORDER BY created_at DESC LIMIT 1');
    console.log('URL:', res.rows[0]?.label_url);
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    pool.end();
  }
}
run();
