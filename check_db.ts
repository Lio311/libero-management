import { db } from "./src/lib/db";
import { influencerPayments } from "./src/lib/db/schema";
async function run() {
  const allPayments = await db.select().from(influencerPayments);
  console.log("Payments:", allPayments.map(p => ({ id: p.id, name: p.influencerName, infId: p.influencerId, month: p.paymentMonth, amount: p.amount })));
}
run().catch(console.error);
