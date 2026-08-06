require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT 'bank' as source, id, task_name as task, due_date
      FROM bank_of_tasks
      WHERE task_name LIKE '%סריקת%' OR task_name LIKE '%100%'
      UNION ALL
      SELECT 'schedule' as source, id, task, week_number::text as due_date
      FROM monthly_schedule
      WHERE task LIKE '%סריקת%' OR task LIKE '%100%';
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
main();
