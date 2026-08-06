const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const cards = await pool.query('SELECT * FROM credit_cards');
    console.log('Cards:', cards.rows);
    
    const ops = await pool.query('SELECT id, store_name FROM wholesale_customers');
    console.log('Wholesale Customers Count:', ops.rows.length);
    console.log('Wholesale Names:', ops.rows.map(r => r.store_name).join(', '));
    
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
check();
