import "dotenv/config";
import { db } from "./src/lib/db/index";
import { wcOrders, velourOrders, laburaOrders } from "./src/lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Querying db...");
  
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const [wc, velour, labura] = await Promise.all([
    db.select({ lineItems: wcOrders.lineItems, dateCreated: wcOrders.dateCreated, status: wcOrders.status }).from(wcOrders).where(sql`${wcOrders.dateCreated} >= ${twoMonthsAgo.toISOString()}`),
    db.select({ lineItems: velourOrders.lineItems, dateCreated: velourOrders.dateCreated, status: velourOrders.status }).from(velourOrders).where(sql`${velourOrders.dateCreated} >= ${twoMonthsAgo.toISOString()}`),
    db.select({ lineItems: laburaOrders.lineItems, dateCreated: laburaOrders.dateCreated, status: laburaOrders.status }).from(laburaOrders).where(sql`${laburaOrders.dateCreated} >= ${twoMonthsAgo.toISOString()}`)
  ]);

  let totalSales = 0;
  let count = 0;

  const allOrders = [...wc, ...velour, ...labura];

  for (const order of allOrders) {
    if (order.status !== 'completed' && order.status !== 'processing') continue;
    
    if (Array.isArray(order.lineItems)) {
      for (const item of order.lineItems) {
        if (item.name && item.name.toLowerCase().includes("memoirs of a perfume collector")) {
          const itemTotal = parseFloat(item.total || "0");
          totalSales += itemTotal;
          count += (item.quantity || 1);
        }
      }
    }
  }

  console.log(`Total Sales: ${totalSales} NIS`);
  console.log(`Units sold: ${count}`);
  
  process.exit(0);
}

main().catch(console.error);
