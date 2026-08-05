"use server";

import { db } from "@/lib/db";
import { bankOfTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateBankOfTaskAction(id: string, data: { taskName?: string | null, assignee?: string | null, status?: string | null, dueDate?: string | null }) {
  try {
    await db.update(bankOfTasks).set({
      taskName: data.taskName,
      assignee: data.assignee,
      status: data.status,
      dueDate: data.dueDate,
    }).where(eq(bankOfTasks.id, id));
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task", error);
    return { success: false, error: "Failed to update task" };
  }
}

export async function createBankOfTaskAction(data: { taskName?: string | null, assignee?: string | null, status?: string | null, dueDate?: string | null }) {
  try {
    const [newTask] = await db.insert(bankOfTasks).values({
      taskName: data.taskName,
      assignee: data.assignee,
      status: data.status || "לא התחיל",
      dueDate: data.dueDate,
    }).returning();
    
    revalidatePath("/", "layout");
    return { success: true, task: newTask };
  } catch (error) {
    console.error("Failed to create task", error);
    return { success: false, error: "Failed to create task" };
  }
}

export async function deleteBankOfTaskAction(id: string) {
  try {
    await db.delete(bankOfTasks).where(eq(bankOfTasks.id, id));
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task", error);
    return { success: false, error: "Failed to delete task" };
  }
}
