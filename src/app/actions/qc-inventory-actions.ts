"use server";

import { db } from "@/lib/db";
import { qcProducts, qcInspections, wcProducts, wcOrders } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function getQcInventoryProducts() {
  try {
    const products = await db.select().from(qcProducts).orderBy(qcProducts.productName);
    
    const allInspections = await db.select().from(qcInspections).orderBy(desc(qcInspections.inspectedAt));
    const latestInspections = new Map<string, Date>();
    
    for (const insp of allInspections) {
      if (!latestInspections.has(insp.productId)) {
        latestInspections.set(insp.productId, insp.inspectedAt);
      }
    }

    // Fetch stock quantities and categories from wcProducts
    const allWcProducts = await db.select({
      id: wcProducts.id,
      stockQuantity: wcProducts.stockQuantity,
      categories: wcProducts.categories,
    }).from(wcProducts);
    
    const stockMap = new Map<number, number>();
    const categoryMap = new Map<number, string>();
    const commerceGroupsList = ["חדירה זול", "חדירה יקר", "בסיס זול", "בסיס יקר", "פרימיום יקר", "פרימיום זול", "מותגי הבית"];
    const commerceGroupMap = new Map<number, string>();
    for (const wp of allWcProducts) {
      stockMap.set(wp.id, wp.stockQuantity || 0);
      
      let categoryStr = "אחר";
      let commerceGroupStr = "";
      if (wp.categories && Array.isArray(wp.categories) && wp.categories.length > 0) {
        const ignoredCats = ["כללי", "חדש באתר", "מבצעים", "הנמכרים ביותר", "חדש בליברו"];
        const meaningfulCat = wp.categories.find((c: any) => c.name && !ignoredCats.includes(c.name) && !commerceGroupsList.includes(c.name));
        
        if (meaningfulCat) {
          categoryStr = meaningfulCat.name;
        } else if (wp.categories[0]?.name) {
          categoryStr = wp.categories[0].name;
        }

        const commerceGroupCat = wp.categories.find((c: any) => c.name && commerceGroupsList.includes(c.name));
        if (commerceGroupCat) {
          commerceGroupStr = commerceGroupCat.name;
        }
      }
      categoryMap.set(wp.id, categoryStr);
      commerceGroupMap.set(wp.id, commerceGroupStr);
    }

    // Fetch orders to calculate sales metrics
    const allWcOrders = await db.select({
      lineItems: wcOrders.lineItems,
      dateCreated: wcOrders.dateCreated,
      status: wcOrders.status,
    }).from(wcOrders);

    const metricsMap = new Map<number, { salesLastWeek: number; salesLastMonth: number; salesMonthBeforeLast: number; totalSales: number; lastSaleDate: Date | null }>();

    for (const product of products) {
      metricsMap.set(product.wooProductId, { salesLastWeek: 0, salesLastMonth: 0, salesMonthBeforeLast: 0, totalSales: 0, lastSaleDate: null });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    for (const order of allWcOrders) {
      if (order.status !== 'completed' && order.status !== 'processing') continue;
      if (!order.lineItems) continue;
      
      let orderDate = order.dateCreated ? new Date(order.dateCreated) : new Date(0);
      
      const items = order.lineItems as any[];
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        const productId = item.product_id;
        if (!productId || !metricsMap.has(productId)) continue;
        
        const qty = item.quantity || 0;
        const metrics = metricsMap.get(productId)!;
        
        metrics.totalSales += qty;
        
        if (!metrics.lastSaleDate || orderDate > metrics.lastSaleDate) {
          metrics.lastSaleDate = orderDate;
        }
        
        if (orderDate >= sevenDaysAgo) {
          metrics.salesLastWeek += qty;
        }
        if (orderDate >= thirtyDaysAgo) {
          metrics.salesLastMonth += qty;
        }
        if (orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo) {
          metrics.salesMonthBeforeLast += qty;
        }
      }
    }
    
    const inventoryProducts = products.map((product) => {
      const dateCreated = product.lastRestockDate || product.dateAddedToSite || product.createdAt;
      
      const createdDate = new Date(dateCreated);
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const metrics = metricsMap.get(product.wooProductId) || { salesLastWeek: 0, salesLastMonth: 0, salesMonthBeforeLast: 0, totalSales: 0, lastSaleDate: null };
      const currentStock = stockMap.get(product.wooProductId) || 0;
      const categories = categoryMap.get(product.wooProductId) || "";
      const commerceGroup = commerceGroupMap.get(product.wooProductId) || "";
      
      return {
        id: product.id,
        wooProductId: product.wooProductId,
        productName: product.productName,
        productSku: product.productSku,
        productImage: product.productImage,
        categories: categories,
        commerceGroup: commerceGroup,
        lastInspectionDate: latestInspections.get(product.id) || null,
        lastPriceStatusDate: product.priceStatusDate || null,
        dateAddedToSite: dateCreated,
        ageDays: ageDays,
        currentStock: currentStock,
        salesLastWeek: metrics.salesLastWeek,
        salesLastMonth: metrics.salesLastMonth,
        salesMonthBeforeLast: metrics.salesMonthBeforeLast,
        totalSales: metrics.totalSales,
        lastSaleDate: metrics.lastSaleDate,
      };
    });
    
    return inventoryProducts;
  } catch (error: any) {
    console.error('getQcInventoryProducts error:', error);
    throw new Error(`שגיאה בטעינת מוצרי בקרת מלאי: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}
