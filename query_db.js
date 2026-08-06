import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query(`SELECT * FROM monthly_schedule WHERE task = 'פגישת מלאי'`);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
