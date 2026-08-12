import { db } from "./src/lib/db";
import { influencerPayments } from "./src/lib/db/schema";
import { like, or } from "drizzle-orm";

async function run() {
  console.log("Resetting July and August payments...");
  const result = await db.update(influencerPayments)
    .set({ isDone: 'לא בוצע', baseSalary: '0' })
    .where(
      or(
        like(influencerPayments.paymentMonth, '%יולי%'),
        like(influencerPayments.paymentMonth, '%אוגוסט%'),
        like(influencerPayments.paymentMonth, '%07-2024%'),
        like(influencerPayments.paymentMonth, '%08-2024%')
      )
    )
    .returning();
    
  console.log(`Updated ${result.length} rows.`);
  for (const r of result) {
    console.log(`- ${r.influencerName} (${r.paymentMonth}): ${r.isDone}, ${r.baseSalary}`);
  }
}

run().catch(console.error).finally(() => process.exit(0));
