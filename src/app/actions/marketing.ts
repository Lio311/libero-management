"use server";

import { db } from "@/lib/db";
import { influencers, influencerPayments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateInfluencer(id: string, data: Partial<typeof influencers.$inferInsert>) {
  try {
    await db.update(influencers).set(data).where(eq(influencers.id, id));
    revalidatePath('/marketing');
  } catch (error: any) {
    console.error('updateInfluencer error:', error);
    throw new Error(`שגיאה בעדכון משפיען: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function createInfluencer(data: Partial<typeof influencers.$inferInsert>) {
  try {
    const [newInfluencer] = await db.insert(influencers).values(data).returning();
    revalidatePath('/marketing');
    return newInfluencer;
  } catch (error: any) {
    console.error('createInfluencer error:', error);
    throw new Error(`שגיאה ביצירת משפיען: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function deleteInfluencer(id: string) {
  try {
    console.log('deleteInfluencer called with id:', id);
    const result = await db.delete(influencers).where(eq(influencers.id, id)).returning();
    console.log('deleteInfluencer result:', result);
    if (result.length === 0) {
      throw new Error(`לא נמצא משפיען עם מזהה ${id}`);
    }
    revalidatePath('/marketing');
  } catch (error: any) {
    console.error('deleteInfluencer error:', error);
    throw new Error(`שגיאה במחיקת משפיען: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function updateInfluencerPayment(id: string, data: Partial<typeof influencerPayments.$inferInsert>) {
  try {
    await db.update(influencerPayments).set(data).where(eq(influencerPayments.id, id));
    revalidatePath('/marketing');
  } catch (error: any) {
    console.error('updateInfluencerPayment error:', error);
    throw new Error(`שגיאה בעדכון תשלום: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function createInfluencerPayment(data: Partial<typeof influencerPayments.$inferInsert>) {
  try {
    const [newPayment] = await db.insert(influencerPayments).values(data).returning();
    revalidatePath('/marketing');
    return newPayment;
  } catch (error: any) {
    console.error('createInfluencerPayment error:', error);
    throw new Error(`שגיאה ביצירת תשלום: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function deleteInfluencerPayment(id: string) {
  try {
    console.log('deleteInfluencerPayment called with id:', id);
    const result = await db.delete(influencerPayments).where(eq(influencerPayments.id, id)).returning();
    console.log('deleteInfluencerPayment result:', result);
    if (result.length === 0) {
      throw new Error(`לא נמצא תשלום עם מזהה ${id}`);
    }
    revalidatePath('/marketing');
  } catch (error: any) {
    console.error('deleteInfluencerPayment error:', error);
    throw new Error(`שגיאה במחיקת תשלום: ${error?.message || 'שגיאה לא ידועה'}`);
  }
}

export async function getInfluencerBaseSalary(influencerId: string, month: string): Promise<number> {
  const { and } = await import("drizzle-orm");
  const result = await db.select({ amount: influencerPayments.amount })
    .from(influencerPayments)
    .where(
      and(
        eq(influencerPayments.influencerId, influencerId),
        eq(influencerPayments.paymentMonth, month)
      )
    )
    .limit(1);
  if (result.length > 0 && result[0].amount) {
    return parseFloat(result[0].amount as string);
  }
  return 0;
}
