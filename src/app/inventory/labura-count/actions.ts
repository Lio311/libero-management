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

export async function updateLaburaInventoryCount(id: string, field: string, value: number | string) {
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

export async function addLaburaItem(butterName: string) {
  try {
    const existingItems = await db.select().from(laburaInventoryCounts);
    const maxOrder = existingItems.length > 0 
      ? Math.max(...existingItems.map(i => i.displayOrder)) 
      : 0;

    await db.insert(laburaInventoryCounts).values({
      butterName,
      displayOrder: maxOrder + 1,
    });

    revalidatePath("/inventory/labura-count");
    return { success: true };
  } catch (error) {
    console.error("Error adding labura item:", error);
    return { success: false, error: "Failed to add item" };
  }
}

export async function toggleArchiveLaburaItem(id: string, isArchived: boolean) {
  try {
    await db.update(laburaInventoryCounts)
      .set({ 
        isArchived,
        updatedAt: new Date()
      })
      .where(eq(laburaInventoryCounts.id, id));
    
    revalidatePath("/inventory/labura-count");
    return { success: true };
  } catch (error) {
    console.error("Error archiving labura item:", error);
    return { success: false, error: "Failed to archive item" };
  }
}

export async function deleteLaburaItem(id: string) {
  try {
    await db.delete(laburaInventoryCounts)
      .where(eq(laburaInventoryCounts.id, id));
    
    revalidatePath("/inventory/labura-count");
    return { success: true };
  } catch (error) {
    console.error("Error deleting labura item:", error);
    return { success: false, error: "Failed to delete item" };
  }
}
