"use server";

import { db } from "@/lib/db";
import { importPayments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateImportPayment(id: string, data: Partial<typeof importPayments.$inferInsert>) {
  try {
    await db.update(importPayments).set(data).where(eq(importPayments.id, id));
    revalidatePath("/finance");
    return { success: true };
  } catch (error) {
    console.error("Failed to update import payment:", error);
    return { success: false, error: "Failed to update import payment" };
  }
}
