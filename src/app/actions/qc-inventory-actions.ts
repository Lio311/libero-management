"use server";

import { db } from "@/lib/db";
import { qcProducts, qcInspections, wcProducts } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function getQcInventoryProducts() {
  try {
    const products = await db.select().from(qcProducts).orderBy(qcProducts.productName);
    const wcProds = await db.select({
      id: wcProducts.id,
      dateCreated: wcProducts.dateCreated
    }).from(wcProducts);
    
    const wcProdMap = new Map(wcProds.map(p => [p.id, p.dateCreated]));
    
    const allInspections = await db.select().from(qcInspections).orderBy(desc(qcInspections.inspectedAt));
    const latestInspections = new Map<string, Date>();
    
    for (const insp of allInspections) {
      if (!latestInspections.has(insp.productId)) {
        latestInspections.set(insp.productId, insp.inspectedAt);
      }
    }
    
    const inventoryProducts = products.map((product) => {
      const dateCreated = wcProdMap.get(product.wooProductId) || product.createdAt;
      
      const now = new Date();
      const createdDate = new Date(dateCreated);
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const ageDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        id: product.id,
        wooProductId: product.wooProductId,
        productName: product.productName,
        productSku: product.productSku,
        productImage: product.productImage,
        lastInspectionDate: latestInspections.get(product.id) || null,
        lastPriceStatusDate: product.priceStatusDate || null,
        dateAddedToSite: dateCreated,
        ageDays: ageDays,
      };
    });
    
    return inventoryProducts;
  } catch (error: any) {
    console.error('getQcInventoryProducts error:', error);
    throw new Error(`שגיאה בטעינת מוצרי בקרת מלאי: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}
