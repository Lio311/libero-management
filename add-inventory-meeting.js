import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query(`SELECT * FROM monthly_schedule WHERE task = 'פגישת מלאי'`);
    if (res.rows.length === 0) {
      await pool.query(`INSERT INTO monthly_schedule (task, status, week_number) VALUES ('פגישת מלאי', 'לא התחיל', 15)`);
      console.log('Added פגישת מלאי');
    } else {
      console.log('Already exists');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
