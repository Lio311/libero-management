require('dotenv').config({path: '.env'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT img FROM scanned_wholesale_products LIMIT 10", (err, res) => {
    console.log(res ? res.rows : err);
    pool.end();
});
