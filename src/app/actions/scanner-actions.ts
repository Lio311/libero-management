"use server";

import { db } from "@/lib/db";
import { wcOrders, wcProducts, velourOrders, velourProducts, laburaOrders, laburaProducts, settings, qcProducts } from "@/lib/db/schema";
import { eq, desc, inArray, and, gte, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { BRAND_CONFIG } from "@/lib/wc-config";

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

export async function getProcessingOrders(store: "libero" | "velour" | "labura" = "libero"): Promise<ScannerOrder[]> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  try {
    const processingOrders = await db.select({
      id: targetOrders.id,
      total: targetOrders.total,
      dateCreated: targetOrders.dateCreated,
      status: targetOrders.status,
      lineItems: targetOrders.lineItems,
      shippingLines: targetOrders.shippingLines,
      billing: targetOrders.billing,
      customerId: targetOrders.customerId,
    }).from(targetOrders)
    .where(eq(targetOrders.status, 'processing'))
    .orderBy(desc(targetOrders.dateCreated));

    const completedOrders = await db.select({
      id: targetOrders.id,
      total: targetOrders.total,
      dateCreated: targetOrders.dateCreated,
      status: targetOrders.status,
      lineItems: targetOrders.lineItems,
      shippingLines: targetOrders.shippingLines,
      billing: targetOrders.billing,
      customerId: targetOrders.customerId,
    }).from(targetOrders)
    .where(eq(targetOrders.status, 'completed'))
    .orderBy(desc(targetOrders.updatedAt))
    .limit(30);

    const orders = [...processingOrders, ...completedOrders];

    return orders.map(order => {
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
    });
  } catch (error: any) {
    console.error('getProcessingOrders error:', error);
    throw new Error(`שגיאה בשליפת הזמנות: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function getOrderById(orderId: number, store: "libero" | "velour" | "labura" = "libero"): Promise<ScannerOrder | null> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  try {
    const orders = await db.select({
      id: targetOrders.id,
      total: targetOrders.total,
      dateCreated: targetOrders.dateCreated,
      status: targetOrders.status,
      lineItems: targetOrders.lineItems,
      shippingLines: targetOrders.shippingLines,
      billing: targetOrders.billing,
      customerId: targetOrders.customerId,
    }).from(targetOrders)
    .where(eq(targetOrders.id, orderId))
    .limit(1);

    if (orders.length === 0) return null;

    const order = orders[0];
    const billing = order.billing as any;
    const customerName = billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : `לקוח ${order.customerId || 'אורח'}`;
    
    const shippingLines = Array.isArray(order.shippingLines) ? order.shippingLines : [];
    const isPickup = shippingLines.some((sl: any) => sl.method_id === 'local_pickup' || sl.method_title?.includes('איסוף עצמי'));
    const rawLineItems = Array.isArray(order.lineItems) ? order.lineItems : [];
    const productIds = rawLineItems.map((item: any) => item.product_id).filter(Boolean);
    
    let imageMap = new Map();
    if (productIds.length > 0) {
      const productsImages = await db.select({
        id: qcProducts.wooProductId,
        image: qcProducts.productImage,
      }).from(qcProducts)
        .where(inArray(qcProducts.wooProductId, productIds));
        
      productsImages.forEach(p => {
        if (p.image) imageMap.set(p.id, p.image);
      });
    }

    const lineItems = rawLineItems.map((item: any) => {
      const dbImage = imageMap.get(item.product_id);
      if (dbImage) {
        if (!item.image) item.image = {};
        item.image.src = dbImage;
      }
      return item;
    });
      
    return {
      id: order.id,
      customerName: customerName || `הזמנה #${order.id}`,
      total: order.total || '0',
      dateCreated: order.dateCreated ? new Date(order.dateCreated).toISOString() : new Date().toISOString(),
      status: order.status || 'processing',
      lineItems,
      isPickup,
    };
  } catch (error: any) {
    console.error('getOrderById error:', error);
    throw new Error(`שגיאה בשליפת הזמנה: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function getScannerStats(store: "libero" | "velour" | "labura" = "libero") {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const processing = await db.select({ id: targetOrders.id }).from(targetOrders).where(eq(targetOrders.status, 'processing'));
    const completed = await db.select({ id: targetOrders.id, updatedAt: targetOrders.updatedAt })
      .from(targetOrders)
      .where(and(eq(targetOrders.status, 'completed'), gte(targetOrders.updatedAt, today)));
      
    return {
      completedToday: completed.length,
      remainingToProcess: processing.length
    };
  } catch (error) {
    console.error('getScannerStats error:', error);
    return { completedToday: 0, remainingToProcess: 0 };
  }
}


export async function markOrderCompleted(orderId: number, store: "libero" | "velour" | "labura" = "libero"): Promise<boolean> {
  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  const config = BRAND_CONFIG[store];
  const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');
  
  try {
    // 1. Update WooCommerce
    const res = await fetch(`${config.baseUrl}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'completed' }),
    });

    if (!res.ok) {
      console.error(`Failed to update WC order ${orderId}`, await res.text());
      return false;
    }

    // 2. Update local DB
    await db.update(targetOrders)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(targetOrders.id, orderId));

    revalidatePath('/shipping-scanner');
    revalidatePath(`/shipping-scanner/${orderId}`);
    
    return true;
  } catch (error) {
    console.error('markOrderCompleted error:', error);
    return false;
  }
}
