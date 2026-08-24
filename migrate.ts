const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_1aDl9LIcAfCH@ep-little-dust-a2p1cl0m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });
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
