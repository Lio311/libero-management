"use server";

import { db } from "@/lib/db";
import { roleHolders, teamTaskConnections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateRoleHolder(id: string, data: Partial<typeof roleHolders.$inferInsert>) {
  try {
    await db.update(roleHolders).set(data).where(eq(roleHolders.id, id));
    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to update role holder:", error);
    return { success: false, error: "Failed to update role holder" };
  }
}

export async function addTeamTaskConnection(sourceTaskId: string, targetTaskId: string) {
  try {
    // Check if connection already exists
    const existing = await db.select().from(teamTaskConnections).where(
      and(
        eq(teamTaskConnections.sourceTaskId, sourceTaskId),
        eq(teamTaskConnections.targetTaskId, targetTaskId)
      )
    );
    if (existing.length > 0) return { success: true }; // Already connected
    
    await db.insert(teamTaskConnections).values({
      sourceTaskId,
      targetTaskId
    });
    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to add task connection:", error);
    return { success: false, error: "Failed to add task connection" };
  }
}

export async function removeTeamTaskConnection(connectionId: string) {
  try {
    await db.delete(teamTaskConnections).where(eq(teamTaskConnections.id, connectionId));
    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove task connection:", error);
    return { success: false, error: "Failed to remove task connection" };
  }
}

export async function createRoleHolder(data: { name: string; role: string }) {
  try {
    const res = await db.insert(roleHolders).values(data).returning();
    revalidatePath("/team");
    return { success: true, id: res[0].id };
  } catch (error) {
    console.error("Failed to create role holder:", error);
    return { success: false, error: "Failed to create role holder" };
  }
}

export async function deleteRoleHolder(id: string) {
  try {
    await db.delete(roleHolders).where(eq(roleHolders.id, id));
    revalidatePath("/team");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete role holder:", error);
    return { success: false, error: "Failed to delete role holder" };
  }
}
