import 'dotenv/config';
import { db } from "./src/lib/db";
import { wcOrders, velourOrders, laburaOrders } from "./src/lib/db/schema";
import { getCustomerHistory } from "./src/lib/customer-history";
import { calculateReward } from "./src/lib/reward-engine";

async function run() {
  console.log("Fetching all orders...");
  const validStatuses = ['completed', 'processing', 'shipped'];
  const l = await db.select().from(wcOrders);
  const v = await db.select().from(velourOrders);
  const la = await db.select().from(laburaOrders);
  
  const allOrders = [...l, ...v, ...la].filter(o => validStatuses.includes(o.status || ''));
  console.log(`Found ${allOrders.length} valid orders.`);
  
  // Group by email
  const customers = new Map();
  for (const o of allOrders) {
    const email = (o.billing as any)?.email?.toLowerCase()?.trim();
    if (!email) continue;
    if (!customers.has(email)) {
      customers.set(email, []);
    }
    customers.get(email).push(o);
  }
  
  console.log(`Found ${customers.size} unique customers.`);
  
  let count9 = 0;
  let count10 = 0;
  
  let i = 0;
  for (const [email, orders] of customers.entries()) {
    i++;
    if (i % 1000 === 0) console.log(`Processed ${i} customers...`);
    
    // Sort by date created desc
    orders.sort((a: any, b: any) => {
      const da = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
      const db = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
      return db - da;
    });
    
    const latestOrder = orders[0];
    
    const history = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum: number, o: any) => sum + parseFloat(o.total?.toString() || '0'), 0),
      pastOrders: orders
    };
    
    const reward = await calculateReward(latestOrder, history);
    if (reward.score === 9) count9++;
    if (reward.score === 10) count10++;
  }
  
  console.log(`Customers with score 9 (VIP): ${count9}`);
  console.log(`Customers with score 10 (Core): ${count10}`);
  process.exit(0);
}

run();
