const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM "generated_shipping_labels" ORDER BY "created_at" DESC LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run();
