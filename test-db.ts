import { db } from "./src/lib/db";
import { bankOfTasks } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const [newTask] = await db.insert(bankOfTasks).values({
    taskName: "Test Task",
    status: "לא התחיל",
    dueDate: "12.08.2024",
  }).returning();
  console.log("Created:", newTask);

  await db.update(bankOfTasks).set({ status: "בוצע" }).where(eq(bankOfTasks.id, newTask.id));
  
  const updated = await db.select().from(bankOfTasks).where(eq(bankOfTasks.id, newTask.id));
  console.log("Updated:", updated[0]);

  await db.delete(bankOfTasks).where(eq(bankOfTasks.id, newTask.id));
  const deleted = await db.select().from(bankOfTasks).where(eq(bankOfTasks.id, newTask.id));
  console.log("Deleted count:", deleted.length);
}
main();
