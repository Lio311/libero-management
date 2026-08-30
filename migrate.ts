const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "print_jobs" (
        "id" serial PRIMARY KEY NOT NULL,
        "store" varchar(50) NOT NULL,
        "order_ids" jsonb NOT NULL,
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Done!");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
