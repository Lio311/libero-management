const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://dummy:dummy@dummy.neon.tech/dummy' });

async function run() {
  try {
    const res = await pool.query("SELECT * FROM print_jobs WHERE job_type = 'shipping-label' ORDER BY created_at DESC LIMIT 5");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    pool.end();
  }
}
run();
