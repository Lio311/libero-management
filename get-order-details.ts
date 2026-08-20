import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });

import { db } from "./src/lib/db";
import { wcOrders, velourOrders, laburaOrders } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCustomerHistory } from "./src/lib/customer-history";
import { calculateReward } from "./src/lib/reward-engine";

async function main() {
  const orderId = 54259;
  const store: string = "libero";
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  
  const orders = await db.select().from(targetOrders).where(eq(targetOrders.id, orderId)).limit(1);
  if (orders.length === 0) {
    console.log("Order not found");
    process.exit(0);
  }
  
  const order = orders[0];
  const billing = order.billing as any;
  const email = billing?.email;
  const phone = billing?.phone;
  const customerId = order.customerId;
  
  const history = await getCustomerHistory(email, phone, customerId || undefined);
  
  console.log("=== Order Summary ===");
  console.log("Total:", order.total);
  console.log("Line Items:", JSON.stringify(order.lineItems, null, 2));
  
  console.log("\n=== Customer History ===");
  console.log("Total Spent:", history.totalSpent);
  console.log("Total Orders:", history.totalOrders);
  
  const reward = await calculateReward(order, history);
  
  console.log("\n=== Reward Calculation ===");
  console.log(JSON.stringify(reward, null, 2));
  
  process.exit(0);
}

main().catch(console.error);
