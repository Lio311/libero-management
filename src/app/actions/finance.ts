"use server";

import { db } from "@/lib/db";
import { importPayments, chinaOrders } from "@/lib/db/schema";
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

export async function createImportPayment(data: Partial<typeof importPayments.$inferInsert>) {
  try {
    const [newPayment] = await db.insert(importPayments).values(data).returning();
    revalidatePath("/finance");
    return { success: true, payment: newPayment };
  } catch (error) {
    console.error("Failed to create import payment:", error);
    return { success: false, error: "Failed to create import payment" };
  }
}

export async function deleteImportPayment(id: string) {
  try {
    await db.delete(importPayments).where(eq(importPayments.id, id));
    revalidatePath("/finance");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete import payment:", error);
    return { success: false, error: "Failed to delete import payment" };
  }
}

export async function createChinaOrder(data: Partial<typeof chinaOrders.$inferInsert>) {
  try {
    const [newOrder] = await db.insert(chinaOrders).values(data).returning();
    revalidatePath("/finance");
    return { success: true, order: newOrder };
  } catch (error) {
    console.error("Failed to create china order:", error);
    return { success: false, error: "Failed to create china order" };
  }
}

export async function updateChinaOrder(id: string, data: Partial<typeof chinaOrders.$inferInsert>) {
  try {
    await db.update(chinaOrders).set(data).where(eq(chinaOrders.id, id));
    revalidatePath("/finance");
    return { success: true };
  } catch (error) {
    console.error("Failed to update china order:", error);
    return { success: false, error: "Failed to update china order" };
  }
}

export async function deleteChinaOrder(id: string) {
  try {
    await db.delete(chinaOrders).where(eq(chinaOrders.id, id));
    revalidatePath("/finance");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete china order:", error);
    return { success: false, error: "Failed to delete china order" };
  }
}
