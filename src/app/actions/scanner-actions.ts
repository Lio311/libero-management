"use server";

import { db } from "@/lib/db";
import { wcOrders, wcProducts, settings } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ScannerOrder = {
  id: number;
  customerName: string;
  total: string;
  dateCreated: string;
  status: string;
  lineItems: any[];
  isPickup: boolean;
};

export async function getScannerSettings(): Promise<string[]> {
  try {
    const res = await db.select().from(settings).where(eq(settings.key, 'barcode_less_keywords')).limit(1);
    if (res.length > 0 && res[0].value) {
      return JSON.parse(res[0].value);
    }
    return ["מיני"]; // default fallback if empty
  } catch (error) {
    console.error('getScannerSettings error:', error);
    return ["מיני"];
  }
}

export async function saveScannerSettings(keywords: string[]) {
  try {
    const valueStr = JSON.stringify(keywords);
    await db.insert(settings).values({
      key: 'barcode_less_keywords',
      value: valueStr,
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value: valueStr },
    });
    revalidatePath('/shipping-scanner');
    revalidatePath('/shipping-scanner/settings');
  } catch (error: any) {
    console.error('saveScannerSettings error:', error);
    throw new Error('שגיאה בשמירת הגדרות');
  }
}

export async function getProcessingOrders(): Promise<ScannerOrder[]> {
  try {
    const orders = await db.select({
      id: wcOrders.id,
      total: wcOrders.total,
      dateCreated: wcOrders.dateCreated,
      status: wcOrders.status,
      lineItems: wcOrders.lineItems,
      shippingLines: wcOrders.shippingLines,
      billing: wcOrders.billing,
      customerId: wcOrders.customerId,
    }).from(wcOrders)
    .where(eq(wcOrders.status, 'processing'))
    .orderBy(desc(wcOrders.dateCreated));

    return orders.map(order => {
      const billing = order.billing as any;
      const customerName = billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : `לקוח ${order.customerId || 'אורח'}`;
      
      const shippingLines = Array.isArray(order.shippingLines) ? order.shippingLines : [];
      // "local_pickup" is the typical WooCommerce method ID for local pickup
      const isPickup = shippingLines.some((sl: any) => sl.method_id === 'local_pickup' || sl.method_title?.includes('איסוף עצמי'));
      
      return {
        id: order.id,
        customerName: customerName || `הזמנה #${order.id}`,
        total: order.total || '0',
        dateCreated: order.dateCreated ? new Date(order.dateCreated).toISOString() : new Date().toISOString(),
        status: order.status || 'processing',
        lineItems: Array.isArray(order.lineItems) ? order.lineItems : [],
        isPickup,
      };
    });
  } catch (error: any) {
    console.error('getProcessingOrders error:', error);
    throw new Error(`שגיאה בשליפת הזמנות: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function getOrderById(orderId: number): Promise<ScannerOrder | null> {
  try {
    const orders = await db.select({
      id: wcOrders.id,
      total: wcOrders.total,
      dateCreated: wcOrders.dateCreated,
      status: wcOrders.status,
      lineItems: wcOrders.lineItems,
      shippingLines: wcOrders.shippingLines,
      billing: wcOrders.billing,
      customerId: wcOrders.customerId,
    }).from(wcOrders)
    .where(eq(wcOrders.id, orderId))
    .limit(1);

    if (orders.length === 0) return null;

    const order = orders[0];
    const billing = order.billing as any;
    const customerName = billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : `לקוח ${order.customerId || 'אורח'}`;
    
    const shippingLines = Array.isArray(order.shippingLines) ? order.shippingLines : [];
    const isPickup = shippingLines.some((sl: any) => sl.method_id === 'local_pickup' || sl.method_title?.includes('איסוף עצמי'));
      
    return {
      id: order.id,
      customerName: customerName || `הזמנה #${order.id}`,
      total: order.total || '0',
      dateCreated: order.dateCreated ? new Date(order.dateCreated).toISOString() : new Date().toISOString(),
      status: order.status || 'processing',
      lineItems: Array.isArray(order.lineItems) ? order.lineItems : [],
      isPickup,
    };
  } catch (error: any) {
    console.error('getOrderById error:', error);
    throw new Error(`שגיאה בשליפת הזמנה: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}
