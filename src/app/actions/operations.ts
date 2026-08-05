"use server";

import { db } from "@/lib/db";
import { wholesaleCustomers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateWholesaleCustomer(
  id: string,
  data: Partial<typeof wholesaleCustomers.$inferInsert>
) {
  try {
    await db
      .update(wholesaleCustomers)
      .set(data)
      .where(eq(wholesaleCustomers.id, id));
    
    revalidatePath("/operations");
    return { success: true };
  } catch (error) {
    console.error("Failed to update wholesale customer:", error);
    return { success: false, error: "Failed to update customer" };
  }
}

export async function createWholesaleCustomer(
  data: Partial<typeof wholesaleCustomers.$inferInsert>
) {
  try {
    const [newCustomer] = await db.insert(wholesaleCustomers).values(data).returning();
    revalidatePath("/operations");
    return { success: true, customer: newCustomer };
  } catch (error) {
    console.error("Failed to create wholesale customer:", error);
    return { success: false, error: "Failed to create customer" };
  }
}

export async function deleteWholesaleCustomer(id: string) {
  try {
    await db.delete(wholesaleCustomers).where(eq(wholesaleCustomers.id, id));
    revalidatePath("/operations");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete wholesale customer:", error);
    return { success: false, error: "Failed to delete customer" };
  }
}
