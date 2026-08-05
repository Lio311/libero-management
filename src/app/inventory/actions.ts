"use server";

import { db } from "@/lib/db";
import { inventoryItems, suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addInventoryItem(data: any) {
  try {
    await db.insert(inventoryItems).values({
      itemIndex: data.itemIndex ? parseInt(data.itemIndex) : null,
      modelName: data.modelName,
      brand: data.brand,
      currentStock: data.currentStock ? data.currentStock.toString() : "0",
      orderedQuantity: data.orderedQuantity ? parseInt(data.orderedQuantity) : 0,
      targetStockLevel: data.targetStockLevel ? data.targetStockLevel.toString() : "0",
      costPrice: data.costPrice ? data.costPrice.toString() : "0",
    });
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return { success: false, error: "Failed to add item" };
  }
}

export async function updateInventoryItem(id: string, data: any) {
  try {
    await db.update(inventoryItems)
      .set({
        itemIndex: data.itemIndex ? parseInt(data.itemIndex) : null,
        modelName: data.modelName,
        brand: data.brand,
        currentStock: data.currentStock ? data.currentStock.toString() : "0",
        orderedQuantity: data.orderedQuantity ? parseInt(data.orderedQuantity) : 0,
        targetStockLevel: data.targetStockLevel ? data.targetStockLevel.toString() : "0",
        costPrice: data.costPrice ? data.costPrice.toString() : "0",
      })
      .where(eq(inventoryItems.id, id));
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return { success: false, error: "Failed to update item" };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return { success: false, error: "Failed to delete item" };
  }
}

export async function updateSupplier(id: string, data: any) {
  try {
    await db.update(suppliers)
      .set({
        brandName: data.brandName,
        inventoryStatus: data.inventoryStatus,
        planningStatus: data.planningStatus,
        contactStatus: data.contactStatus,
        notes: data.notes
      })
      .where(eq(suppliers.id, id));
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: "Failed to update supplier" };
  }
}

export async function createSupplier(data: any) {
  try {
    const [newSupplier] = await db.insert(suppliers)
      .values({
        brandName: data.brandName,
        inventoryStatus: data.inventoryStatus,
        planningStatus: data.planningStatus,
        contactStatus: data.contactStatus,
        notes: data.notes
      }).returning();
    revalidatePath("/inventory");
    return { success: true, supplier: newSupplier };
  } catch (error) {
    console.error("Error creating supplier:", error);
    return { success: false, error: "Failed to create supplier" };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await db.delete(suppliers).where(eq(suppliers.id, id));
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return { success: false, error: "Failed to delete supplier" };
  }
}
