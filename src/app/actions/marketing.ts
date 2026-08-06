"use server";

import { db } from "@/lib/db";
import { influencers, influencerPayments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateInfluencer(id: string, data: Partial<typeof influencers.$inferInsert>) {
  await db.update(influencers).set(data).where(eq(influencers.id, id));
  revalidatePath('/marketing');
}

export async function createInfluencer(data: Partial<typeof influencers.$inferInsert>) {
  const [newInfluencer] = await db.insert(influencers).values(data).returning();
  revalidatePath('/marketing');
  return newInfluencer;
}

export async function deleteInfluencer(id: string) {
  await db.delete(influencers).where(eq(influencers.id, id));
  revalidatePath('/marketing');
}

export async function updateInfluencerPayment(id: string, data: Partial<typeof influencerPayments.$inferInsert>) {
  await db.update(influencerPayments).set(data).where(eq(influencerPayments.id, id));
  revalidatePath('/marketing');
}

export async function createInfluencerPayment(data: Partial<typeof influencerPayments.$inferInsert>) {
  const [newPayment] = await db.insert(influencerPayments).values(data).returning();
  revalidatePath('/marketing');
  return newPayment;
}

export async function deleteInfluencerPayment(id: string) {
  await db.delete(influencerPayments).where(eq(influencerPayments.id, id));
  revalidatePath('/marketing');
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
