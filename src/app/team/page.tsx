import { db } from "@/lib/db";
import { teamTasks, roleHolders, monthlySchedule, bankOfTasks } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import TeamClient from "./team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  let allTasksRaw: any[] = [];
  let roleHoldersRaw: any[] = [];
  let monthlyScheduleRaw: any[] = [];
  let bankOfTasksRaw: any[] = [];

  try {
    allTasksRaw = await db.select().from(teamTasks).orderBy(asc(teamTasks.assignee));
    roleHoldersRaw = await db.select().from(roleHolders);
    monthlyScheduleRaw = await db.select().from(monthlySchedule).orderBy(asc(monthlySchedule.weekNumber));
    bankOfTasksRaw = await db.select().from(bankOfTasks).orderBy(asc(bankOfTasks.itemIndex));
  } catch (e) {
    console.error("Database connection failed, using empty data:", e);
  }

  // Group by assignee
  const groupedTasks: Record<string, string[]> = {};
  for (const task of allTasksRaw) {
    if (task.assignee) {
      if (!groupedTasks[task.assignee]) {
        groupedTasks[task.assignee] = [];
      }
      groupedTasks[task.assignee].push(task.taskDescription || "");
    }
  }

  return (
    <TeamClient 
      roleHolders={roleHoldersRaw}
      monthlySchedule={monthlyScheduleRaw}
      bankOfTasks={bankOfTasksRaw}
      groupedTasks={groupedTasks}
    />
  );
}
