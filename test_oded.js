require("dotenv").config();
const { Client } = require("pg");

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const inf = await client.query("SELECT * FROM influencers WHERE influencer_name LIKE '%עודד%' OR influencer_name LIKE '%oded%' OR brand LIKE '%עודד%'");
  console.log("Oded in influencers:", inf.rows);
  const pay = await client.query("SELECT * FROM influencer_payments WHERE influencer_name LIKE '%עודד%' OR influencer_name LIKE '%oded%'");
  console.log("Oded in payments:", pay.rows);
  await client.end();
}
run().catch(console.error);
