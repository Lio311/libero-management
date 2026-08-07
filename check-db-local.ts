import { db } from './src/lib/db/index';
import { wcOrders, wcProducts } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const ordersCount = await db.select({ count: sql<number>`count(*)` }).from(wcOrders);
    const productsCount = await db.select({ count: sql<number>`count(*)` }).from(wcProducts);
    
    const oldestOrder = await db.select({ date: wcOrders.dateCreated }).from(wcOrders).orderBy(wcOrders.dateCreated).limit(1);
    const newestOrder = await db.select({ date: wcOrders.dateCreated }).from(wcOrders).orderBy(sql`${wcOrders.dateCreated} DESC`).limit(1);

    console.log(`Total Orders: ${ordersCount[0].count}`);
    console.log(`Total Products: ${productsCount[0].count}`);
    console.log(`Oldest Order Date: ${oldestOrder.length > 0 ? oldestOrder[0].date : 'N/A'}`);
    console.log(`Newest Order Date: ${newestOrder.length > 0 ? newestOrder[0].date : 'N/A'}`);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
