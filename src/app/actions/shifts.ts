"use server";

import { db } from "@/lib/db";
import { shifts } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getShifts(startDate: string, endDate: string) {
  try {
    const data = await db
      .select()
      .from(shifts)
      .where(
        and(
          gte(shifts.date, startDate),
          lte(shifts.date, endDate)
        )
      );
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return { success: false, error: "Failed to fetch shifts" };
  }
}

export async function addShift(data: {
  date: string;
  employeeName: string;
  department: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}) {
  try {
    const [newShift] = await db.insert(shifts).values({
      date: data.date,
      employeeName: data.employeeName,
      department: data.department,
      startTime: data.startTime || "",
      endTime: data.endTime || "",
      notes: data.notes || "",
    }).returning();
    
    revalidatePath("/shifts");
    return { success: true, data: newShift };
  } catch (error) {
    console.error("Error adding shift:", error);
    return { success: false, error: "Failed to add shift" };
  }
}

export async function deleteShift(id: string) {
  try {
    await db.delete(shifts).where(eq(shifts.id, id));
    revalidatePath("/shifts");
    return { success: true };
  } catch (error) {
    console.error("Error deleting shift:", error);
    return { success: false, error: "Failed to delete shift" };
  }
}
