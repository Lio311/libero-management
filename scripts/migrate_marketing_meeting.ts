import { db } from "@/lib/db";
import { monthlySchedule, bankOfTasks } from "@/lib/db/schema";
import { like } from "drizzle-orm";

async function main() {
  console.log("Deleting from bankOfTasks...");
  await db.delete(bankOfTasks).where(like(bankOfTasks.taskName, "%ישיבת שיווק%"));

  console.log("Adding to monthlySchedule...");
  await db.insert(monthlySchedule).values([
    { weekNumber: 1, task: "ישיבת שיווק ומילוי אקסל שיווק", status: "לא התחיל" },
    { weekNumber: 8, task: "ישיבת שיווק ומילוי אקסל שיווק", status: "לא התחיל" },
    { weekNumber: 15, task: "ישיבת שיווק ומילוי אקסל שיווק", status: "לא התחיל" },
    { weekNumber: 22, task: "ישיבת שיווק ומילוי אקסל שיווק", status: "לא התחיל" }
  ]);

  console.log("Done.");
}

main().catch(console.error);
