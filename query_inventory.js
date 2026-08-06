require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM monthly_schedule WHERE task LIKE '%מלאי%'");
    console.log("Inventory meetings:");
    console.table(res.rows);
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
