import { db } from "./src/lib/db";
import { influencers, influencerPayments } from "./src/lib/db/schema";

async function run() {
  const allInfluencers = await db.select().from(influencers);
  const allPayments = await db.select().from(influencerPayments);
  console.log("Influencers:", allInfluencers);
  console.log("Payments:", allPayments);
}
run().catch(console.error);
