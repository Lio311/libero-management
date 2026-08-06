const { Client } = require("pg");
require("dotenv").config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  const res = await client.query("SELECT payment_month, count(*) FROM influencer_payments GROUP BY payment_month");
  console.log("Payments group by month:", res.rows);
  const res2 = await client.query("SELECT payment_month, count(*) FROM influencers GROUP BY payment_month");
  console.log("Influencers group by month:", res2.rows);
  await client.end();
}
run().catch(console.error);
