import { Pool } from "pg";
import { config } from "dotenv";

config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'influencers';
    `);
    console.log("Influencers Table Columns:");
    console.table(res.rows);
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
