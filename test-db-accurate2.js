const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT 
        COALESCE(qc_products.last_restock_date, wc_products.updated_at, qc_products.date_added_to_site, qc_products.created_at) as date_created,
        wc_products.stock_quantity
      FROM qc_products
      LEFT JOIN wc_products ON qc_products.woo_product_id = wc_products.id
    `);
    
    const now = new Date();
    let inStock = 0;
    let counts = { green: 0, yellow: 0, orange: 0, dark_orange: 0, red: 0 };
    
    for (const p of res.rows) {
      if (p.stock_quantity > 0) {
        inStock++;
        const createdDate = new Date(p.date_created);
        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
        const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (ageDays > 90) counts.red++;
        else if (ageDays >= 45) counts.dark_orange++;
        else if (ageDays >= 30) counts.orange++;
        else if (ageDays >= 14) counts.yellow++;
        else counts.green++;
      }
    }
    console.log({ inStock, counts });
  } finally {
    pool.end();
  }
}
run();
