"use server";

import { db } from "@/lib/db";
import { qcProducts, qcInspections } from "@/lib/db/schema";
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

export async function getQcProducts() {
  try {
    const products = await db.select().from(qcProducts).orderBy(qcProducts.productName);
    
    const productsWithInspections = await Promise.all(
      products.map(async (product) => {
        const inspections = await db
          .select()
          .from(qcInspections)
          .where(eq(qcInspections.productId, product.id))
          .orderBy(desc(qcInspections.inspectedAt));
        
        return {
          ...product,
          inspections,
          lastInspection: inspections.length > 0 ? inspections[0].inspectedAt : null,
        };
      })
    );
    
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
    
    for (const product of products) {
      const inspections = await db
        .select()
        .from(qcInspections)
        .where(eq(qcInspections.productId, product.id))
        .orderBy(desc(qcInspections.inspectedAt))
        .limit(1);
      
      if (inspections.length === 0) {
        neverInspectedCount++;
      } else if (inspections[0].inspectedAt < threeMonthsAgo) {
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
