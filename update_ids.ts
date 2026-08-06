import { db } from "./src/lib/db";
import { influencers, influencerPayments } from "./src/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { influencersConfig } from "./src/config/influencers";

async function run() {
  const allInfluencers = await db.select().from(influencers);
  const allPayments = await db.select().from(influencerPayments);
  
  const nameToId = Object.values(influencersConfig).reduce((acc, config) => {
    acc[config.name.trim()] = config.id;
    return acc;
  }, {} as Record<string, string>);

  console.log("Mapping:", nameToId);

  let updatedInfluencers = 0;
  for (const inf of allInfluencers) {
    if (!inf.influencerId && inf.influencerName) {
      const id = nameToId[inf.influencerName.trim()];
      if (id) {
        await db.update(influencers).set({ influencerId: id }).where(eq(influencers.id, inf.id));
        updatedInfluencers++;
      }
    }
  }

  let updatedPayments = 0;
  for (const pay of allPayments) {
    if (!pay.influencerId && pay.influencerName) {
      const id = nameToId[pay.influencerName.trim()];
      // Also some names might be slight variations, like "ראות סטורלוביץ'" vs "ראות סטורלוביץ"
      const mappedId = id || (pay.influencerName.includes("ראות") ? "reut" : 
                              pay.influencerName.includes("שוהם") ? "shoam" : 
                              pay.influencerName.includes("נועה") ? "noa" : 
                              pay.influencerName.includes("ליה") ? "liya" : 
                              pay.influencerName.includes("שקד") ? "shaked" : 
                              pay.influencerName.includes("הדר") ? "hf" : 
                              pay.influencerName.includes("נגה") ? "noga" : 
                              pay.influencerName.includes("ניצן") ? "gold" : null);
      if (mappedId) {
        await db.update(influencerPayments).set({ influencerId: mappedId }).where(eq(influencerPayments.id, pay.id));
        updatedPayments++;
      }
    }
  }

  console.log(`Updated ${updatedInfluencers} influencers and ${updatedPayments} payments.`);
}
run().catch(console.error);
