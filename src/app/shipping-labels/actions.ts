"use server";

import { db } from "@/lib/db";
import { generatedShippingLabels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteShippingLabel(id: string) {
  try {
    await db.delete(generatedShippingLabels).where(eq(generatedShippingLabels.id, id));
    revalidatePath("/shipping-labels");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete shipping label:", error);
    return { success: false, error: "Failed to delete shipping label" };
  }
}
