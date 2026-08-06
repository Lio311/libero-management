import { db } from "./src/lib/db";
import { influencers, influencerPayments } from "./src/lib/db/schema";
import { eq, and } from "drizzle-orm";
import fs from "fs";

async function run() {
  const data = JSON.parse(fs.readFileSync("new_data.json", "utf-8"));

  let updatedInf = 0;
  for (const item of data.influencers || []) {
    if (item.influencerName && item.paymentMonth) {
      // update all matching influencer name
      await db.update(influencers)
        .set({ paymentMonth: item.paymentMonth })
        .where(eq(influencers.influencerName, item.influencerName));
      updatedInf++;
    }
  }

  let updatedPay = 0;
  for (const item of data.influencerPayments || []) {
    if (item.influencerName && item.paymentMonth) {
      const amountStr = item.amount ? item.amount.replace(/[^0-9.-]+/g, "") : null;
      if (amountStr) {
        await db.update(influencerPayments)
          .set({ paymentMonth: item.paymentMonth })
          .where(and(
            eq(influencerPayments.influencerName, item.influencerName),
            eq(influencerPayments.amount, amountStr)
          ));
        updatedPay++;
      } else {
        await db.update(influencerPayments)
          .set({ paymentMonth: item.paymentMonth })
          .where(eq(influencerPayments.influencerName, item.influencerName));
        updatedPay++;
      }
    }
  }

  console.log(`Updated paymentMonths for ${updatedInf} influencers and ${updatedPay} payments`);
}

run().catch(console.error);
