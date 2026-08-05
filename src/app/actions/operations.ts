"use server";

import { db } from "@/lib/db";
import { wholesaleCustomers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateWholesaleCustomer(
  id: string,
  data: {
    storeName?: string;
    city?: string;
    address?: string;
    phoneCall?: string;
    visit?: string;
    potential?: string;
    interest?: string;
    notes?: string;
  }
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
