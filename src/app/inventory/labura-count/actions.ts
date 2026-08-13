"use server";

import { db } from "@/lib/db";
import { laburaInventoryCounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getLaburaInventoryCounts() {
  try {
    const data = await db.select().from(laburaInventoryCounts).orderBy(laburaInventoryCounts.displayOrder);
    return data;
  } catch (error) {
    console.error("Error fetching labura inventory counts:", error);
    return [];
  }
}

export async function updateLaburaInventoryCount(id: string, field: string, value: number) {
  try {
    await db.update(laburaInventoryCounts)
      .set({ 
        [field]: value,
        updatedAt: new Date()
      })
      .where(eq(laburaInventoryCounts.id, id));
    
    revalidatePath("/inventory/labura-count");
    return { success: true };
  } catch (error) {
    console.error("Error updating inventory count:", error);
    return { success: false, error: "Failed to update" };
  }
}
