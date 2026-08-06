require("dotenv").config();
import { db } from "./src/lib/db";
import { influencers, influencerPayments } from "./src/lib/db/schema";

async function run() {
  const inf = await db.select().from(influencers);
  console.log("Active influencers:", inf.length);
  const pay = await db.select().from(influencerPayments);
  console.log("Total payments:", pay.length);
  if (pay.length > 0) {
    console.log("Unique months:", [...new Set(pay.map(p => p.paymentMonth).filter(Boolean))]);
  }
}
run().catch(console.error).finally(() => process.exit(0));
