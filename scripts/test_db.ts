import { db } from "../src/lib/db";
import { bankOfTasks } from "../src/lib/db/schema";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log("Inserting a test task...");
  const [newTask] = await db.insert(bankOfTasks).values({
    taskName: "Test Task " + Date.now(),
    assignee: "Me",
    status: "לא התחיל",
    dueDate: "20.10.2023",
  }).returning();
  
  console.log("Inserted:", newTask);
  
  console.log("Fetching tasks...");
  const tasks = await db.select().from(bankOfTasks);
  console.log("Total tasks:", tasks.length);
}

test().catch(console.error);
