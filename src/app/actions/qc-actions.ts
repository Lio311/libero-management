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
    
    const productsWithInspections = products.map((product) => {
      const inspections = inspectionsByProduct.get(product.id) || [];
      return {
        ...product,
        inspections,
        lastInspection: inspections.length > 0 ? inspections[0].inspectedAt : null,
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
