"use server";

import { db } from "@/lib/db";
import { monthlySchedule } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateMonthlyScheduleDay(id: string, newDay: number) {
  try {
    await db.update(monthlySchedule).set({
      weekNumber: newDay
    }).where(eq(monthlySchedule.id, id));
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update schedule day", error);
    return { success: false, error: "Failed to update schedule day" };
  }
}

export async function toggleMonthlyScheduleStatus(id: string, isCompleted: boolean) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await db.update(monthlySchedule).set({
      status: isCompleted ? 'בוצע' : 'לא התחיל',
      lastCompletedDate: isCompleted ? todayStr : null
    }).where(eq(monthlySchedule.id, id));
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle schedule status", error);
    return { success: false, error: "Failed to toggle schedule status" };
  }
}
