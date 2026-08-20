import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wcOrders, velourOrders, laburaOrders, orderRewards } from '@/lib/db/schema';
import { getCustomerHistory } from '@/lib/customer-history';
import { getOrCalculateOrderReward } from '@/lib/reward-engine';
import { notExists, sql } from 'drizzle-orm';

export const maxDuration = 300; // 5 mins on Vercel
export const dynamic = 'force-dynamic';

async function processOrdersForStore(storeName: "libero" | "velour" | "labura", ordersTable: any) {
  // Find orders that don't have a reward calculated yet
  // We'll just do a raw SQL query or drizzle query to find them
  const unprocessed = await db.execute(sql`
    SELECT id FROM ${ordersTable}
    WHERE id NOT IN (
      SELECT order_id FROM order_rewards WHERE store = ${storeName}
    )
    ORDER BY date_created DESC
    LIMIT 50
  `);

  let count = 0;
  for (const row of unprocessed.rows) {
    const orderId = row.id as number;
    // Fetch full order
    const orderRecord = await db.select().from(ordersTable).where(sql`id = ${orderId}`).limit(1);
    if (orderRecord.length === 0) continue;
    
    const order = orderRecord[0];
    const billing = order.billing as any;
    const email = billing?.email;
    const phone = billing?.phone;
    
    // Calculate history (this might be slightly expensive so we do it one by one)
    const history = await getCustomerHistory(email, phone, order.customerId || undefined);
    
    // This will calculate and save
    await getOrCalculateOrderReward(order, storeName, history);
    count++;
  }
  
  return count;
}

export async function GET(request: Request) {
  try {
    const countLibero = await processOrdersForStore("libero", wcOrders);
    const countVelour = await processOrdersForStore("velour", velourOrders);
    const countLabura = await processOrdersForStore("labura", laburaOrders);
    
    return NextResponse.json({
      success: true,
      processed: {
        libero: countLibero,
        velour: countVelour,
        labura: countLabura
      }
    });
  } catch (error: any) {
    console.error("Cron calculate-rewards error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
