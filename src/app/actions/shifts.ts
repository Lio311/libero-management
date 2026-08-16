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

export async function updateShift(id: string, data: {
  date: string;
  employeeName: string;
  department: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}) {
  try {
    const [updatedShift] = await db.update(shifts).set({
      date: data.date,
      employeeName: data.employeeName,
      department: data.department,
      startTime: data.startTime || "",
      endTime: data.endTime || "",
      notes: data.notes || "",
    }).where(eq(shifts.id, id)).returning();
    
    revalidatePath("/shifts");
    return { success: true, data: updatedShift };
  } catch (error) {
    console.error("Error updating shift:", error);
    return { success: false, error: "Failed to update shift" };
  }
}

export async function copyPreviousWeekShifts(currentWeekStart: string, currentWeekEnd: string) {
  try {
    // We need to fetch shifts from exactly 7 days prior
    const prevWeekStartObj = new Date(currentWeekStart);
    prevWeekStartObj.setDate(prevWeekStartObj.getDate() - 7);
    const prevWeekStartStr = prevWeekStartObj.toISOString().split("T")[0];

    const prevWeekEndObj = new Date(currentWeekEnd);
    prevWeekEndObj.setDate(prevWeekEndObj.getDate() - 7);
    const prevWeekEndStr = prevWeekEndObj.toISOString().split("T")[0];

    const prevShifts = await db
      .select()
      .from(shifts)
      .where(
        and(
          gte(shifts.date, prevWeekStartStr),
          lte(shifts.date, prevWeekEndStr)
        )
      );

    if (prevShifts.length === 0) {
      return { success: false, error: "לא נמצאו משמרות בשבוע הקודם" };
    }

    const newShiftsData = prevShifts.map((shift) => {
      // Add 7 days to the shift's date
      const shiftDateObj = new Date(shift.date);
      shiftDateObj.setDate(shiftDateObj.getDate() + 7);
      const newDateStr = shiftDateObj.toISOString().split("T")[0];

      return {
        date: newDateStr,
        employeeName: shift.employeeName,
        department: shift.department,
        startTime: shift.startTime,
        endTime: shift.endTime,
        notes: shift.notes,
      };
    });

    await db.insert(shifts).values(newShiftsData);

    revalidatePath("/shifts");
    return { success: true, count: newShiftsData.length };
  } catch (error) {
    console.error("Error copying shifts:", error);
    return { success: false, error: "Failed to copy shifts" };
  }
}
