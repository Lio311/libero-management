"use server";

import { db } from "@/lib/db";
import { qcProducts, qcInspections, wcProducts, wcOrders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markProductInspected(productId: string) {
  try {
    await db.insert(qcInspections).values({
      productId,
      inspectedAt: new Date(),
    });
    await db.update(qcProducts).set({ updatedAt: new Date() }).where(eq(qcProducts.id, productId));
    revalidatePath('/qc');
  } catch (error: any) {
    console.error('markProductInspected error:', error);
    throw new Error(`שגיאה בסימון בקרה: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function updateProductNotes(productId: string, notes: string) {
  try {
    await db.update(qcProducts).set({ notes, updatedAt: new Date() }).where(eq(qcProducts.id, productId));
    revalidatePath('/qc');
  } catch (error: any) {
    console.error('updateProductNotes error:', error);
    throw new Error(`שגיאה בעדכון הערות: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function updateProductPriceStatus(productId: string, priceStatus: string | null) {
  try {
    const updateData = {
      priceStatus,
      priceStatusDate: priceStatus ? new Date() : null,
      updatedAt: new Date()
    };
    await db.update(qcProducts).set(updateData).where(eq(qcProducts.id, productId));
    revalidatePath('/qc');
  } catch (error: any) {
    console.error('updateProductPriceStatus error:', error);
    throw new Error(`שגיאה בעדכון סטטוס תמחור: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function getQcProducts() {
  try {
    const products = await db.select().from(qcProducts).orderBy(qcProducts.productName);
    
    const allInspections = await db.select().from(qcInspections).orderBy(desc(qcInspections.inspectedAt));
    const inspectionsByProduct = new Map<string, typeof allInspections>();
    
    for (const insp of allInspections) {
      const arr = inspectionsByProduct.get(insp.productId) || [];
      arr.push(insp);
      inspectionsByProduct.set(insp.productId, arr);
    }
    
    // Fetch stock quantities and categories from wcProducts
    const allWcProducts = await db.select({
      id: wcProducts.id,
      stockQuantity: wcProducts.stockQuantity,
      categories: wcProducts.categories,
      dateCreated: wcProducts.dateCreated,
    }).from(wcProducts);
    
    const stockMap = new Map<number, number>();
    const wcDateCreatedMap = new Map<number, Date | null>();
    const categoryMap = new Map<number, string>();
    const commerceGroupsList = ["חדירה זול", "חדירה יקר", "בסיס זול", "בסיס יקר", "פרימיום יקר", "פרימיום זול", "מותגי הבית"];
    const commerceGroupMap = new Map<number, string>();

    for (const wp of allWcProducts) {
      stockMap.set(wp.id, wp.stockQuantity || 0);
      wcDateCreatedMap.set(wp.id, wp.dateCreated);
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

    const allWcOrders = await db.select({
      lineItems: wcOrders.lineItems,
      dateCreated: wcOrders.dateCreated,
      status: wcOrders.status,
    }).from(wcOrders);

    const metricsMap = new Map<number, { totalSales: number; lastSaleDate: Date | null }>();
    for (const product of products) {
      metricsMap.set(product.wooProductId, { totalSales: 0, lastSaleDate: null });
    }

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
      }
    }
    
    const now = new Date();
    const productsWithInspections = products.map((product) => {
      const inspections = inspectionsByProduct.get(product.id) || [];
      const wcDateCreated = wcDateCreatedMap.get(product.wooProductId);
      const dateCreated = product.lastRestockDate || wcDateCreated || product.dateAddedToSite || product.createdAt;
      const createdDate = new Date(dateCreated);
      const ageDays = Math.ceil(Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const metrics = metricsMap.get(product.wooProductId) || { totalSales: 0, lastSaleDate: null };

      return {
        ...product,
        inspections,
        lastInspection: inspections.length > 0 ? inspections[0].inspectedAt : null,
        currentStock: stockMap.get(product.wooProductId) || 0,
        ageDays,
        totalSales: metrics.totalSales,
        lastSaleDate: metrics.lastSaleDate,
        categories: categoryMap.get(product.wooProductId) || "",
        commerceGroup: commerceGroupMap.get(product.wooProductId) || "",
      };
    });
    
    return productsWithInspections;
  } catch (error: any) {
    console.error('getQcProducts error:', error);
    throw new Error(`שגיאה בטעינת מוצרים: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function getQcStats() {
  try {
    const products = await db.select().from(qcProducts);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    let inspectedCount = 0;
    let needsReinspectionCount = 0;
    let neverInspectedCount = 0;
    
    const allInspections = await db.select().from(qcInspections);
    const latestInspections = new Map<string, Date>();
    
    for (const insp of allInspections) {
      const current = latestInspections.get(insp.productId);
      if (!current || insp.inspectedAt > current) {
        latestInspections.set(insp.productId, insp.inspectedAt);
      }
    }
    
    for (const product of products) {
      const latest = latestInspections.get(product.id);
      
      if (!latest) {
        neverInspectedCount++;
      } else if (latest < threeMonthsAgo) {
        needsReinspectionCount++;
      } else {
        inspectedCount++;
      }
    }
    
    return {
      total: products.length,
      inspected: inspectedCount,
      needsReinspection: needsReinspectionCount,
      neverInspected: neverInspectedCount,
      pending: neverInspectedCount + needsReinspectionCount,
    };
  } catch (error: any) {
    console.error('getQcStats error:', error);
    throw new Error(`שגיאה בטעינת סטטיסטיקות: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}
