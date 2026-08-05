import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { wholesaleCustomers, influencerPayments, influencers } from "../src/lib/db/schema";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const db = drizzle(client);

  const data = JSON.parse(fs.readFileSync("new_data.json", "utf-8"));

  // Wholesale Customers
  if (data.wholesale && data.wholesale.length > 0) {
    console.log(`Inserting ${data.wholesale.length} wholesale customers...`);
    await db.delete(wholesaleCustomers);
    for (const item of data.wholesale) {
      await db.insert(wholesaleCustomers).values({
        storeName: item.storeName,
        city: item.city,
        address: item.address,
        phoneCall: item.phoneCall,
        visit: item.visit,
        potential: item.potential,
        interest: item.interest,
        notes: item.notes,
      });
    }
  }

  // Influencer Payments
  if (data.influencerPayments && data.influencerPayments.length > 0) {
    console.log(`Inserting ${data.influencerPayments.length} influencer payments...`);
    await db.delete(influencerPayments);
    for (const item of data.influencerPayments) {
      await db.insert(influencerPayments).values({
        influencerName: item.influencerName,
        amount: item.amount ? item.amount.replace(/[^0-9.-]+/g, "") : null,
        isDone: item.isDone,
        paymentMonth: item.paymentMonth,
      });
    }
  }

  // Influencers
  if (data.influencers && data.influencers.length > 0) {
    console.log(`Inserting ${data.influencers.length} influencers...`);
    await db.delete(influencers);
    for (const item of data.influencers) {
      await db.insert(influencers).values({
        brand: item.brand,
        isPaid: item.isPaid,
        videoCount: item.videoCount,
        postCount: item.postCount,
        activities: item.activities,
        influencerName: item.influencerName,
        productsGiven: item.productsGiven,
        videosUploaded: item.videosUploaded,
        notes: item.notes,
      });
    }
  }

  console.log("New Data Seed Complete!");
  await client.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Error seeding new data:", err);
  process.exit(1);
});
