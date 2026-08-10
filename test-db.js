const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT 
        (EXTRACT(EPOCH FROM NOW()) - EXTRACT(EPOCH FROM COALESCE(last_restock_date, date_added_to_site, created_at))) / 86400 as age_days,
        wc_products.stock_quantity
      FROM qc_products
      LEFT JOIN wc_products ON qc_products.woo_product_id = wc_products.id
    `);
    const products = res.rows;
    let inStock = 0;
    let inStockAndDarkOrange = 0;
    
    for (const p of products) {
      if (p.stock_quantity > 0) {
        inStock++;
        if (p.age_days >= 45 && p.age_days <= 90) { // actually 45 to 90
          inStockAndDarkOrange++;
        }
      }
    }
    console.log({ inStock, inStockAndDarkOrange });
  } finally {
    pool.end();
  }
}
run();
