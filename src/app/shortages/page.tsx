import { db } from "@/lib/db";
import { orderScanProgress, wcOrders, velourOrders, laburaOrders } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import ShortagesClient from "./shortages-client";

export default async function ShortagesPage() {
  // Fetch all scan progress records
  const allProgress = await db.select().from(orderScanProgress);
  
  // Filter for orders that have missing items
  const shortageRecords = allProgress.filter(record => {
    const items = record.items as any[];
    return items && items.some((item: any) => item.isMissing === true);
  });

  // Get order details for each store
  const shortagesByStore: any[] = [];
  
  for (const record of shortageRecords) {
    const items = record.items as any[];
    const missingItems = items.filter((item: any) => item.isMissing === true);
    
    let orderDetails: any = null;
    const targetTable = record.store === 'velour' ? velourOrders : record.store === 'labura' ? laburaOrders : wcOrders;
    
    try {
      const orders = await db.select().from(targetTable).where(eq(targetTable.id, record.orderId));
      if (orders.length > 0) orderDetails = orders[0];
    } catch (e) {
      console.error('Error fetching order details:', e);
    }
    
    shortagesByStore.push({
      orderId: record.orderId,
      store: record.store,
      missingItems: missingItems.map((item: any) => ({
        name: item.name || item.productName || 'לא ידוע',
        sku: item.sku || item.barcode || '',
        expected: item.expected || item.quantity || 0,
        scanned: item.scanned || 0,
        imageUrl: item.imageUrl || item.image?.src || null,
      })),
      customerName: orderDetails?.billing ? (orderDetails.billing as any).first_name + ' ' + (orderDetails.billing as any).last_name : 'לא ידוע',
      total: orderDetails?.total || '0',
      dateCreated: orderDetails?.dateCreated || record.updatedAt,
      status: orderDetails?.status || 'unknown',
    });
  }

  return <ShortagesClient shortages={shortagesByStore} />;
}
