import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { velourOrders, wcOrders, laburaOrders, generatedShippingLabels } from "@/lib/db/schema";
import { eq, desc, like, or, count, inArray } from "drizzle-orm";

// Temporary diagnostic endpoint - DELETE after debugging
export async function GET(request: Request) {
  const url = new URL(request.url);
  const term = url.searchParams.get("term") || "";
  const store = url.searchParams.get("store") || "velour";
  const secret = url.searchParams.get("secret");
  
  // Basic protection
  if (secret !== "debug2024") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const targetOrders = store === "velour" ? velourOrders : store === "labura" ? laburaOrders : wcOrders;
  
  const results: Record<string, any> = {};

  try {
    // 1. How many total orders in this store?
    const totalCount = await db.select({ count: count() }).from(targetOrders);
    results.totalOrders = totalCount[0]?.count;

    // 2. How many processing orders?
    const procCount = await db.select({ count: count() }).from(targetOrders).where(eq(targetOrders.status, 'processing'));
    results.processingOrders = procCount[0]?.count;

    // 3. How many completed orders?
    const compCount = await db.select({ count: count() }).from(targetOrders).where(eq(targetOrders.status, 'completed'));
    results.completedOrders = compCount[0]?.count;

    // 4. How many labels in generatedShippingLabels?
    const labelCount = await db.select({ count: count() }).from(generatedShippingLabels);
    results.totalLabels = labelCount[0]?.count;

    if (term) {
      // 5. Search for the term in generatedShippingLabels
      const matchingLabels = await db.select().from(generatedShippingLabels)
        .where(or(
          like(generatedShippingLabels.barcode, `%${term}%`),
          like(generatedShippingLabels.orderId, `%${term}%`)
        ))
        .limit(10);
      results.matchingLabels = matchingLabels;

      // 6. Try to find the term as an order ID
      const isNumeric = /^\d+$/.test(term);
      if (isNumeric) {
        const orderId = parseInt(term, 10);
        const matchedOrder = await db.select({
          id: targetOrders.id,
          status: targetOrders.status,
          dateCreated: targetOrders.dateCreated,
        }).from(targetOrders).where(eq(targetOrders.id, orderId)).limit(1);
        results.orderById = matchedOrder;
      }

      // 7. Search in lineItems of recent orders (look for SKU / product name)
      const recent200 = await db.select({
        id: targetOrders.id,
        status: targetOrders.status,
        lineItems: targetOrders.lineItems,
      }).from(targetOrders)
        .orderBy(desc(targetOrders.dateCreated))
        .limit(200);

      const skuMatches = recent200.filter(o => {
        const json = JSON.stringify(o.lineItems || {}).toLowerCase();
        return json.includes(term.toLowerCase());
      }).map(o => ({
        id: o.id,
        status: o.status,
        matchingItems: (o.lineItems as any[])?.filter((item: any) => {
          const itemStr = JSON.stringify(item).toLowerCase();
          return itemStr.includes(term.toLowerCase());
        }).map((item: any) => ({ name: item.name, sku: item.sku, product_id: item.product_id }))
      }));
      results.skuMatches = skuMatches;
      results.recentOrdersSearched = recent200.length;

      // 8. Show sample SKUs from the first 5 recent orders (to understand data structure)
      results.sampleLineItems = recent200.slice(0, 3).map(o => ({
        id: o.id,
        items: (o.lineItems as any[])?.map((item: any) => ({
          name: item.name,
          sku: item.sku,
          product_id: item.product_id
        }))
      }));
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack?.split("\n").slice(0, 5) }, { status: 500 });
  }
}
