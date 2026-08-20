import { db } from "@/lib/db";
import { wcOrders, velourOrders, laburaOrders } from "@/lib/db/schema";
import { sql, eq, or, and, inArray } from "drizzle-orm";

export interface OrderHistoryStats {
  totalOrders: number;
  totalSpent: number;
  pastOrders: any[];
}

export async function getCustomerHistory(
  email?: string,
  phone?: string,
  customerId?: number
): Promise<OrderHistoryStats> {
  let stats: OrderHistoryStats = {
    totalOrders: 0,
    totalSpent: 0,
    pastOrders: []
  };

  if (!email && !phone && !customerId) {
    return stats;
  }

  // Define the condition
  const conditions = [];
  if (customerId && customerId > 0) {
    conditions.push(sql`customer_id = ${customerId}`);
  }
  if (email) {
    conditions.push(sql`billing->>'email' = ${email}`);
  }
  if (phone) {
    // Basic phone normalization (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');
    if (normalizedPhone) {
        conditions.push(sql`REPLACE(billing->>'phone', '-', '') LIKE ${'%' + normalizedPhone + '%'}`);
    }
  }

  const whereClause = or(...conditions);
  if (!whereClause) return stats;

  try {
    // Fetch from all stores (only completed or processing)
    const validStatuses = ['completed', 'processing', 'shipped'];
    
    const [libero, velour, labura] = await Promise.all([
      db.select().from(wcOrders).where(and(whereClause, inArray(wcOrders.status, validStatuses))),
      db.select().from(velourOrders).where(and(whereClause, inArray(velourOrders.status, validStatuses))),
      db.select().from(laburaOrders).where(and(whereClause, inArray(laburaOrders.status, validStatuses)))
    ]);

    const allOrders = [...libero, ...velour, ...labura];
    
    stats.pastOrders = allOrders;
    stats.totalOrders = allOrders.length;
    stats.totalSpent = allOrders.reduce((sum, order) => {
      const orderTotal = parseFloat(order.total?.toString() || '0');
      return sum + (isNaN(orderTotal) ? 0 : orderTotal);
    }, 0);

  } catch (error) {
    console.error("Error fetching customer history:", error);
  }

  return stats;
}
