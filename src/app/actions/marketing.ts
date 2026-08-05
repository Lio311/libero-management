"use server";

import { db } from "@/lib/db";
import { influencers, influencerPayments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateInfluencer(id: string, data: Partial<typeof influencers.$inferInsert>) {
  await db.update(influencers).set(data).where(eq(influencers.id, id));
  revalidatePath('/marketing');
}

export async function updateInfluencerPayment(id: string, data: Partial<typeof influencerPayments.$inferInsert>) {
  await db.update(influencerPayments).set(data).where(eq(influencerPayments.id, id));
  revalidatePath('/marketing');
}
